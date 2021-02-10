import log from "../../utils/log";
import invertColor from "../../utils/invertColor";
import {getCardsDataSet, getCoords, calculateCardSideSize, updateEventListeners, throttle} from "./utils";

const templates = {
    wrapper: `
        <div class="memory-cards-wrapper" id="{{id}}"></div>
    `,
    playground: `
        <div class="memory-playground">
            <div class="memory-playground__card-rows-wrapper">
                {{#renderSet}}
                    <div class="memory-playground__card-row" style="height: {{rowHeight}}">
                        {{#.}}
                            <div class="memory-playground__card-cell is-handled" 
                                style="width: {{cellWidth}}" 
                                data-handlers="click" 
                                data-initiator="memory-playground-card">  
                                    <div class="memory-playground__flip-card memory-playground__flip-card-front" 
                                        data-isactive="{{isActive}}" 
                                        data-cardid="{{id}}" 
                                        style="background-image: url({{src}})"></div>
                                    <div class="memory-playground__flip-card memory-playground__flip-card-back" 
                                        data-isactive="{{isActive}}" 
                                        data-cardid="{{id}}" 
                                        style="background-image: url({{coverSrc}})"></div>
                            </div>
                        {{/.}}
                    </div>
                {{/renderSet}}
            </div>
            {{#isShowCover}}
                <div class="memory-playground__cover-wrapper">
                    <div class="memory-playground__cover">
                        <h2 class="memory-playground__cover-title">{{coverHeader}}</h2>
                        <button class="memory-playground__cover-btn is-handled" 
                            data-handlers="click" 
                            data-initiator="memory-cover-start" 
                            style="background-color: {{colorTheme}}; color: {{buttonColor}}">{{coverButtonText}}</button>
                    </div>
                </div>
            {{/isShowCover}}
            {{#isShowFeedBack}}
                <div class="memory-playground__feedback-wrapper">
                    <div class="memory-playground__feedback">
                        <div class="memory-playground__feedback-images">
                            <div class="memory-playground__feedback-image back" style="background-image: url({{pair.firstImage.src}})"></div>
                            <div class="memory-playground__feedback-image front" style="background-image: url({{pair.secondImage.src}})"></div>
                        </div>
                        <p class="memory-playground__feedback-description">{{pair.description}}</p>
                        <button class="memory-playground__feedback-btn is-handled" 
                            data-handlers="click" 
                            data-initiator="memory-feedback-next"
                            style="background-color: {{colorTheme}}; color: {{buttonColor}}">Next</button>
                    </div>
                </div>
            {{/isShowFeedBack}}
        </div>
    `,
    finalScreen: `
        <div class="memory-final-screen">
            {{#imageSrc}}
                <img class="memory-final-screen__image" src="{{imageSrc}}" alt="Cover image">
            {{/imageSrc}}
            <div class="memory-final-screen__content {{_classes.content}}">
                <div class="memory-final-screen__content-header">{{header}}</div>
                <div class="memory-final-screen__content-description">{{description}}</div>
                <div class="memory-final-screen__content-button-group">
                    {{#isActionButton}}
                        <button class="memory-final-screen__content-btn is-handled" 
                            data-handlers="click" 
                            data-initiator="memory-final-screen-redirect" 
                            style="background-color: {{colorTheme}}; 
                            color: {{buttonColor}}">{{actionButtonText}}</button>
                    {{/isActionButton}}
                        <button class="memory-final-screen__content-btn is-handled" 
                            data-handlers="click" 
                            data-initiator="memory-final-screen-restart">Restart</button>
                </div>
                {{#imageDisclaimer}}
                    <div class="memory-final-screen__content-image-disclaimer">{{imageDisclaimer}}</div>
                {{/imageDisclaimer}}
            </div>
        </div>
    `,
}

const templateTitles = {
    wrapper: "wrapper",
    playground: "playground",
    finalScreen: "finalScreen",
}

const CARD_PROPORTIONS_HEIGHT = {
    '1:1': 1,
    '5:4': 0.8,
    '4:5': 1.2
}

export default function (cnt, {M, methods, sendMessage}) {
    let _wrapperElement = null
    let _initialData = null
    let _renderSet = null
    let _prevSelectedCard = null
    let _isShowCover = false
    let _isShowFeedBack = false
    let _isUserSelectionBlocked = false

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
        _renderSet = _renderSet.reduce((acc, arr) => {
            if(arr.some(card => card.id === cardId)) {
                acc.push(arr.map(card => card.id === cardId ? {...card, isActive: visibility}: card))
            } else {
                acc.push(arr)
            }
            return acc
        },[])
        setScreen(templateTitles.playground)
        updateEventListeners(_wrapperElement, handlers)
    }

    const onCardClick = (evt) => {
        if (_isUserSelectionBlocked) {
            return
        }

        const cardId = evt.target.dataset.cardid
        const card = _renderSet.reduce((acc, row) => {
            const card = row.find(card => card.id === cardId)
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
            if (_prevSelectedCard.pairId === card.pairId) {
                updateCardVisibility(card.id, true)

                // (4)Fourth step: show card feedback.
                const { showFeedback, pairList } = _initialData.struct.pairs
                if (showFeedback) {
                    const pair = pairList.find((pair) => pair.id === card.pairId)
                    handlers.click({initiator: 'memory-feedback-next', payload: pair})
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

        // (6)Last step: Game over
        if (_renderSet.every(row => row.every(card => card.isActive))) {
            handlers.click({initiator: 'memory-playground-final'})
        }
    }

    const resizeObserver = new ResizeObserver(throttle(() => {
        setScreen(templateTitles.playground)
        updateEventListeners(_wrapperElement, handlers)
    }, 300))

    const setScreen = (type, payload = {}) => {
        switch (type) {
            case templateTitles.playground: {
                const proportions = _initialData.struct.playground.cardProportions
                const [ cellCount ] = _initialData.struct.playground.cardLayout.split('x').map(x => Number(x))

                _wrapperElement.innerHTML = M.render(templates.playground, {
                    //playground
                    renderSet: _renderSet,
                    rowHeight: `${calculateCardSideSize(_wrapperElement.offsetWidth, cellCount, CARD_PROPORTIONS_HEIGHT[proportions])}px`,
                    cellWidth: `${calculateCardSideSize(_wrapperElement.offsetWidth, cellCount)}px`,
                    // cover
                    isShowCover: _isShowCover,
                    coverHeader: _initialData.struct.playground.coverHeader,
                    coverButtonText: _initialData.struct.playground.coverButtonText,
                    // feedBack
                    isShowFeedBack: _isShowFeedBack,
                    pair: payload,
                    // general
                    colorTheme: _initialData.colorTheme,
                    buttonColor: invertColor(_initialData.colorTheme, true),
                });

                sendMessage('scrollParent', {
                    top: getCoords(_wrapperElement).top - 20 // 20 = top offset
                })
                break;
            }
            case templateTitles.finalScreen: {
                _wrapperElement.innerHTML = M.render(templates.finalScreen, {
                    header: _initialData.struct.finalScreen.header,
                    description: _initialData.struct.finalScreen.description,
                    imageSrc: _initialData.struct.finalScreen.imageSrc,
                    imageDisclaimer: _initialData.struct.finalScreen.imageDisclaimer,
                    isActionButton: _initialData.isActionButton,
                    actionButtonText: _initialData.actionButtonText,
                    // general
                    colorTheme: _initialData.colorTheme,
                    buttonColor: invertColor(_initialData.colorTheme, true),
                    _classes: {
                        content: _initialData.struct.finalScreen.imageSrc ? '' : 'no-image'
                    }
                });

                sendMessage('scrollParent', {
                    top: getCoords(_wrapperElement).top - 20 // 20 = top offset
                })

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
                    _isShowCover = isShowCover
                    _isShowFeedBack = false
                    _renderSet = getCardsDataSet(cardLayout, pairList, cardBackImage)
                    setScreen(templateTitles.playground)
                    updateEventListeners(_wrapperElement, handlers)
                    if (initiator === 'memory-final-screen-restart') {
                        sendAction('memory-final-screen-restart')
                    }
                    break;
                }
                case 'memory-cover-start': {
                    _isShowCover = !_isShowCover
                    setScreen(templateTitles.playground)
                    updateEventListeners(_wrapperElement, handlers)
                    sendAction('memory-cover-start')
                    break;
                }
                case 'memory-feedback-next': {
                    _isShowFeedBack = !_isShowFeedBack
                    setScreen(templateTitles.playground, payload)
                    updateEventListeners(_wrapperElement, handlers)
                    sendAction('memory-feedback-next')
                    break;
                }
                case 'memory-playground-card': {
                    onCardClick(evt)
                    sendAction('memory-playground-final')
                    break;
                }
                case 'memory-playground-final': {
                    setScreen(templateTitles.finalScreen)
                    updateEventListeners(_wrapperElement, handlers)
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
            console.log(data)
            try {
                _initialData = data
                const wrapperId = `mc_${data.id}`
                const wrapper = M.render(templates.wrapper, {id: wrapperId})

                methods.add(cnt, wrapper, data.t)

                _wrapperElement = document.getElementById(wrapperId)
                resizeObserver.observe(_wrapperElement);
                handlers.click({initiator: 'memory-start'})
            } catch (err) {
                log('error', '11 (MemoryCards)', data.id, null, err)
            }
        },
        postRender: null
    }
}