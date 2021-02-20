import log from "../../utils/log";
import invertColor from "../../utils/invertColor";
import {
    getCardsDataSet,
    calculateCardSideSize,
    updateEventListeners,
    CreateStopwatch
} from "./utils";
import throttle from "../../utils/throttle";

const templates = {
    wrapper: `
        <div class="memory-cards-wrapper" id="{{id}}">
            <div class="memory-cards-wrapper__screen-{{id}}"></div>
            <div class="memory-cards-wrapper__modal-{{id}}"></div>
        </div>
    `,
    playgroundScreen: `
        <div class="memory-playground">
            {{#enableTimer}}
                <div class="memory-playground__statistic-wrapper">
                    <div class="memory-playground__statistic-moves-wrapper">
                        <span class="memory-playground__statistic-moves-title">Number of moves:</span>
                        <span class="memory-playground__statistic-moves">{{movesCount}}</span>
                    </div>
                    <div>
                        <div class="memory-playground__statistic-timer">{{stopWatchTime}}</div>
                    </div>
                </div>
            {{/enableTimer}}
            <div class="memory-playground__card-rows-wrapper">
                {{#renderSet}}
                    <div class="memory-playground__card-row" style="height: {{rowHeight}}">
                        {{#.}}
                            <div class="memory-playground__card-cell is-handled" 
                                style="width: {{cellWidth}}" 
                                id="{{id}}" 
                                data-isactive="{{isActive}}" 
                                data-handlers="click"
                                data-initiator="memory-playground-card">  
                                <div class="memory-playground__card-cell-inner">
                                    <div class="memory-playground__flip-card memory-playground__flip-card-front" style="background-image: url({{src}})"></div>
                                    <div class="memory-playground__flip-card memory-playground__flip-card-back" style="background-image: url({{coverSrc}})"></div>
                                </div>
                            </div>
                        {{/.}}
                    </div>
                {{/renderSet}}
            </div>
        </div>
    `,
    finalScreen: `
        <div class="memory-final-screen">
            {{#imageSrc}}
                <img class="memory-final-screen__image" src="{{imageSrc}}" alt="Cover image">
            {{/imageSrc}}
            <div class="memory-final-screen__content {{_classes.content}}">     
                {{#enableTimer}}
                    <div class="memory-playground__timer-wrapper">
                        <div class="memory-playground__timer-counter">{{stopWatchTime}}</div>
                    </div>
                {{/enableTimer}}       
                <div class="memory-final-screen__content-header">{{header}}</div>
                <div class="memory-final-screen__content-description">{{description}}</div>
                    {{#isActionButton}}
                        <button class="memory-final-screen__content-btn is-handled" 
                            data-handlers="click" 
                            data-initiator="memory-final-screen-redirect" 
                            style="background-color: {{colorTheme}}; 
                            color: {{buttonColor}}">{{actionButtonText}}</button>
                    {{/isActionButton}}
                    <button class="memory-final-screen__content-btn memory-final-screen__content-btn-restart is-handled" 
                        data-handlers="click" 
                        data-initiator="memory-final-screen-restart">Restart</button>
                {{#imageDisclaimer}}
                    <div class="memory-final-screen__content-image-disclaimer">{{imageDisclaimer}}</div>
                {{/imageDisclaimer}}
            </div>
        </div>
    `,
    coverModal: `
        <div class="memory-playground__cover-wrapper">
            <div class="memory-playground__cover">
                <h2 class="memory-playground__cover-title">{{coverHeader}}</h2>
                <button class="memory-playground__cover-btn is-handled" 
                    data-handlers="click" 
                    data-initiator="memory-cover-start" 
                    style="background-color: {{colorTheme}}; color: {{buttonColor}}">{{coverButtonText}}</button>
            </div>
        </div>
    `,
    feedbackModal: `
        <div class="memory-playground__feedback-wrapper">
            <div class="memory-playground__feedback">
                <div class="memory-playground__feedback-images">
                    <div class="memory-playground__feedback-image back" 
                    style="background-image: url({{pair.firstImage.src}}); width: {{imageWidth}}; height: {{imageHeight}}"></div>
                    <div class="memory-playground__feedback-image front" 
                    style="background-image: url({{pair.secondImage.src}}); width: {{imageWidth}}; height: {{imageHeight}}"></div>
                </div>
                <p class="memory-playground__feedback-description">{{pair.description}}</p>
                <button class="memory-playground__feedback-btn is-handled" 
                    data-handlers="click" 
                    data-initiator="memory-feedback-close"
                    style="background-color: {{colorTheme}}; color: {{buttonColor}}">Next</button>
            </div>
        </div>
    `,
}

const templateTitles = {
    wrapper: "wrapper",
    playgroundScreen: "playgroundScreen",
    finalScreen: "finalScreen",
    coverModal: 'coverModal',
    feedbackModal: 'feedbackModal',
}

const CARD_PROPORTIONS_HEIGHT = {
    '1:1': 1,
    '5:4': 0.8,
    '4:5': 1.2
}

export default function (cnt, {M, methods, sendMessage}) {
    //common
    let _initialData = null
    let _activeScreen = null
    let _modalElement = null
    let _screenElement = null
    let _screenWidth = null
    //memory logic
    let _renderSet = null
    let _prevSelectedCard = null
    let _isAllActive = false
    let _isUserSelectionBlocked = false
    //Statistic
    const _stopWatch = new CreateStopwatch()
    let _stopWatchTime = '00:00'
    let _movesCount = 0

    // Pre-parse (for high speed loading)
    for (const template of Object.values(templates)) {
        M.parse(template)
    }

    const sendAction = (target) => {
        sendMessage('action', {
            block: 'memoryCards',
            id: _initialData.id,
            type: 'click',
            data: {
                target
            }
        })
    }

    const updateCardVisibility = (cardId, visibility) => {
        try {
            const cardElement = document.getElementById(cardId)
            cardElement.dataset.isactive = visibility
            _renderSet = _renderSet.reduce((acc, arr) => {
                if (arr.some(card => card.id === cardId)) {
                    acc.push(arr.map(card => card.id === cardId ? {...card, isActive: visibility} : card))
                } else {
                    acc.push(arr)
                }
                return acc
            }, [])
        } catch (err) {
            log('error', '11 (MemoryCards)', data.id, null, err)
        }
    }

    const updateDomElement = (elementClass, content) => {
        try {
            const [DOMElement] = _screenElement.getElementsByClassName(elementClass)
            if (DOMElement) {
                DOMElement.innerHTML = content
            }
        } catch (err) {
            log('error', '11 (MemoryCards)', data.id, null, err)
        }
    }

    const startStopWatch = () => {
        _stopWatch.startTimer((prop) => {
            const time = `${String(prop.minute).padStart(2, '0')}:${String(prop.second).padStart(2, '0')}`
            updateDomElement('memory-playground__statistic-timer', time)
            _stopWatchTime = `${String(prop.minute).padStart(2, '0')}:${String(prop.second).padStart(2, '0')}`
        })
    }

    const onCardClick = (evt) => {
        if (_isUserSelectionBlocked) {
            return
        }

        const card = _renderSet.reduce((acc, row) => {
            const card = row.find(card => card.id === evt.currentTarget.id)
            if (card) {
                acc = card
            }
            return acc
        }, null)

        if (!card) {
            return
        }

        // (1)First step: Store first selected card in 'prevSelectedCard' and show it.
        if (!_prevSelectedCard) {
            if (card.isActive) {
                return
            }
            updateCardVisibility(card.id, true)
            _prevSelectedCard = card
            return
        }

        // (2)Second step: Do nothing if selected previously selected card.
        if (_prevSelectedCard && _prevSelectedCard.id === card.id) {
            return
        }

        // React only on non active cards
        if (!card.isActive) {

            // (3)Third step: show card if pair or hide both selected and previous selected cards.
            updateDomElement('memory-playground__statistic-moves', ++_movesCount)
            if (_prevSelectedCard.pairId === card.pairId) {
                updateCardVisibility(card.id, true)

                // (4)Fourth step: show card feedback.
                const {isShowFeedback, pairList} = _initialData.struct.pairs
                const isAllActive = _renderSet.every(row => row.every(card => card.isActive))

                if (isShowFeedback) {
                    const pair = pairList.find((pair) => pair.id === card.pairId)
                    _isUserSelectionBlocked = true
                    setTimeout(() => {
                        handlers.click({initiator: 'memory-feedback-show', payload: pair})
                        _isUserSelectionBlocked = false
                    }, 600)

                    // (6)Last step: If there is feedback show final screen after feedback
                    _isAllActive = isAllActive
                } else {

                    // (6)Last step: If there is no feedback immediately show final screen
                    if (isAllActive) {
                        handlers.click({initiator: 'memory-playground-final'})
                    }
                }

                // (5)Fifth step: clean previous selection
                _prevSelectedCard = null

            } else {
                updateCardVisibility(card.id, true)
                updateCardVisibility(_prevSelectedCard.id, true)
                _isUserSelectionBlocked = true
                setTimeout(() => {
                    updateCardVisibility(card.id, false)
                    updateCardVisibility(_prevSelectedCard.id, false)
                    _isUserSelectionBlocked = false

                    // (5)Fifth step: clean previous selection
                    _prevSelectedCard = null
                }, 1000)
            }
        }
    }

    const resizeObserver = new ResizeObserver(throttle(() => {
        if (_screenElement.offsetWidth !== _screenWidth && _activeScreen === templateTitles.playgroundScreen) {
            _screenWidth = _screenElement.offsetWidth
            renderTemplates(templateTitles.playgroundScreen)
            updateEventListeners(_screenElement, handlers)
        }
    }, 300))

    const renderTemplates = (type, payload = {}) => {
        const generalSetting = {
            colorTheme: _initialData.colorTheme,
            buttonColor: invertColor(_initialData.colorTheme, true),
        }
        switch (type) {
            case templateTitles.playgroundScreen: {
                const proportions = _initialData.struct.playground.cardProportions
                const [cellCount] = _initialData.struct.playground.cardLayout.value.split('x').map(x => Number(x))

                _screenElement.innerHTML = M.render(templates.playgroundScreen, {
                    renderSet: _renderSet,
                    enableTimer: _initialData.enableTimer,
                    movesCount: _movesCount,
                    stopWatchTime: _stopWatchTime,
                    rowHeight: `${calculateCardSideSize(_screenWidth, cellCount, CARD_PROPORTIONS_HEIGHT[proportions])}px`,
                    cellWidth: `${calculateCardSideSize(_screenWidth, cellCount)}px`,
                    ...generalSetting
                });

                _activeScreen = templateTitles.playgroundScreen
                break;
            }
            case templateTitles.finalScreen: {
                _screenElement.innerHTML = M.render(templates.finalScreen, {
                    header: _initialData.struct.finalScreen.header,
                    description: _initialData.struct.finalScreen.description,
                    imageSrc: _initialData.struct.finalScreen.imageSrc,
                    imageDisclaimer: _initialData.struct.finalScreen.imageDisclaimer,
                    isActionButton: _initialData.isActionButton,
                    actionButtonText: _initialData.actionButtonText,
                    enableTimer: _initialData.enableTimer,
                    stopWatchTime: _stopWatch.getTime(),
                    _classes: {
                        content: _initialData.struct.finalScreen.imageSrc ? '' : 'no-image'
                    },
                    ...generalSetting
                });

                _activeScreen = templateTitles.finalScreen
                break;
            }
            case templateTitles.coverModal: {
                _modalElement.innerHTML = payload && payload.isShowCover ?
                    M.render(templates.coverModal, {
                        coverHeader: _initialData.struct.playground.coverHeader,
                        coverButtonText: _initialData.struct.playground.coverButtonText,
                        ...generalSetting
                    })
                    :
                    ''
                break;
            }
            case templateTitles.feedbackModal: {
                const proportions = _initialData.struct.playground.cardProportions

                _modalElement.innerHTML = payload && payload.isShowFeedBack ?
                    M.render(templates.feedbackModal, {
                        pair: payload.pair,
                        imageHeight: `${160 * CARD_PROPORTIONS_HEIGHT[proportions]}px`,
                        imageWidth: `160px`,
                        ...generalSetting
                    })
                    :
                    ''
                break;
            }
            default:
                log('error', '11 (MemoryCards)', _initialData.id, `Screen type not detected - ${type}`)
                break;
        }
    }

    const handlers = {
        click: ({initiator, payload}, evt) => {
            if (evt) evt.preventDefault()
            switch (initiator) {
                case 'memory-start':
                case 'memory-final-screen-restart': {
                    const {isShowCover, cardLayout, cardBackImage} = _initialData.struct.playground;
                    const {pairList} = _initialData.struct.pairs;
                    _stopWatch.clearTimer()
                    _stopWatchTime = '00:00'
                    _movesCount = 0
                    _renderSet = getCardsDataSet(cardLayout.value, pairList, cardBackImage)
                    renderTemplates(templateTitles.playgroundScreen)
                    renderTemplates(templateTitles.coverModal, {isShowCover})
                    updateEventListeners(_screenElement, handlers)
                    updateEventListeners(_modalElement, handlers)
                    if (initiator === 'memory-final-screen-restart') {
                        sendAction('memory-final-screen-restart')
                    }
                    break;
                }
                case 'memory-cover-start': {
                    const {enableTimer} = _initialData;
                    if (enableTimer && !_stopWatch.isTimerStarted()) {
                        startStopWatch()
                    }
                    renderTemplates(templateTitles.coverModal, {isShowCover: false})
                    sendAction('memory-cover-start')
                    break;
                }
                case 'memory-feedback-show': {
                    renderTemplates(templateTitles.feedbackModal, {isShowFeedBack: true, pair: payload})
                    updateEventListeners(_modalElement, handlers)
                    _stopWatch.pauseTimer()
                    sendAction('memory-feedback-show')
                    break;
                }
                case 'memory-feedback-close': {
                    renderTemplates(templateTitles.feedbackModal, {isShowFeedBack: false})
                    if (_isAllActive) {
                        handlers.click({initiator: 'memory-playground-final'})
                        return
                    }
                    _stopWatch.unPauseTimer()
                    sendAction('memory-feedback-close')
                    break;
                }
                case 'memory-playground-card': {
                    const {enableTimer} = _initialData;
                    if(enableTimer &&!_stopWatch.isTimerStarted()) {
                        startStopWatch()
                    }
                    onCardClick(evt)
                    sendAction('memory-playground-card')
                    break;
                }
                case 'memory-playground-final': {
                    renderTemplates(templateTitles.finalScreen)
                    updateEventListeners(_screenElement, handlers)
                    _stopWatch.pauseTimer()
                    sendAction('memory-playground-final')
                    break;
                }
                case 'memory-final-screen-redirect': {
                    window.open(_initialData.actionButtonLink, '_blank');
                    sendAction('memory-final-screen-redirect')
                    break;
                }
                default:
                    break;
            }
        }
    }

    return {
        render: data => {
            try {
                _initialData = data
                const wrapperId = `mc_${data.id}`
                const wrapper = M.render(templates.wrapper, {id: wrapperId})

                methods.add(cnt, wrapper, data.t)

                const [screenElement, modalElement] = document.getElementById(wrapperId).children
                _screenElement = screenElement
                _modalElement = modalElement

                resizeObserver.observe(screenElement)
                handlers.click({initiator: 'memory-start'})
            } catch (err) {
                log('error', '11 (MemoryCards)', data.id, null, err)
            }
        },
        postRender: null
    }
}