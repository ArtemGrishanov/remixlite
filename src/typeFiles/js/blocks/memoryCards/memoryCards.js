import log from "../../utils/log";
import invertColor from "../../utils/invertColor";
import {getCardsDataSet, getCoords, calculateCardSideSize, updateActive} from "./utils";

const templates = {
    wrapper: `
        <div class="memory-cards-wrapper" id="{{id}}"></div>
    `,
    playground: `
        <div class="memory-playground">
            
            <button class="is-handled" data-handlers="click" data-initiator="memory-cover-start">Cover</button>
            <button class="is-handled" data-handlers="click" data-initiator="memory-feedback-next">Feed back</button>
            <button class="is-handled" data-handlers="click" data-initiator="memory-playground-final">Final</button>
                    
  
            <div class="memory-playground__card-rows-wrapper">
                {{#renderSet}}
                    <div class="memory-playground__card-row" style="height: {{rowHeight}}">
                        {{#.}}
                        <div class="memory-playground__card-cell is-handled" 
                            style="width: {{cellWidth}}" 
                            data-handlers="click" 
                            data-initiator="memory-playground-card">
                            <div class="memory-playground__flip-card-inner">
                            
                                {{#isActive}}
                                    <div class="memory-playground__flip-card-back" data-cardid="{{id}}" style="background-image: url({{src}})"></div>
                                {{/isActive}}
                                {{^isActive}}
                                    <div class="memory-playground__flip-card-front" data-cardid="{{id}}" style="background-image: url({{coverSrc}})"></div>
                                ({{/isActive}}
                            </div>
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
                
                {{#callToActionButton}}
                    <div class="link-block">
                        <button class="is-handled" data-handlers="click" 
                            data-initiator="result.callToAction" 
                            style="background-color: {{colorTheme}}; 
                            color: {{buttonColor}}">{{callToActionButtonText}}</button>
                    </div>
                {{/callToActionButton}}
                <div class="button-block">
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
    let _isShowCover = false
    let _isShowFeedBack = false
    //
    let _renderSet = []
    let _isUserSelectionBlocked = false
    let _prevSelectedCard = null

    // Pre-parse (for high speed loading)
    for (const template of Object.values(templates)) {
        M.parse(template)
    }

    const updateEventListeners = (additionalPayload = {}) => {
        if (_wrapperElement) {
            const handledElements = _wrapperElement.getElementsByClassName("is-handled");
            for (const el of handledElements) {
                for (const handle of el.dataset.handlers.split('|')) {
                    el.addEventListener(handle, evt => handlers[handle]({
                        initiator: el.dataset.initiator,
                        payload: {
                            ...el.dataset,
                            ...additionalPayload
                        }
                    }, evt))
                }
            }
        }
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

    const showCard = cardId => {
        _renderSet = updateActive(_renderSet, cardId, true)
        console.log(_renderSet)
        setScreen(templateTitles.playground)
        updateEventListeners()
    }

    const hideCard = cardId => {
        _renderSet = updateActive(_renderSet, cardId, false)
        setScreen(templateTitles.playground)
        updateEventListeners()
    }

    const onCardClick = (evt) => {
        const cardId = evt.target.dataset.cardid
        console.log(cardId)
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

        if (_isUserSelectionBlocked) {
            return
        }

        // (1)First step: Store first selected card in 'prevSelectedCard' and show it.
        if (!_prevSelectedCard) {
            if (card.isActive) {
                return
            }
            showCard(card.id)
            _prevSelectedCard = card
            return
        }

        // (2)Second step: Do nothing if selected previously selected card.
        if (_prevSelectedCard && _prevSelectedCard.id === card.id) {
            return
        }

        const isPair = _prevSelectedCard.pairId === card.pairId

        // React only on non active cards
        if (!card.isActive) {
            // (3)Third step: show card if pair or hide both selected and previous selected cards.
            if (isPair) {
                showCard(card.id)
                const pair = _initialData.struct.pairs.pairList.find((pair) => pair.id === card.pairId)
                handlers.click({initiator: 'memory-feedback-next', payload: pair})

                // (4)Fourth step: clean previous selection
                _prevSelectedCard = null
            } else {
                showCard(card.id)
                showCard(_prevSelectedCard.id)
                _isUserSelectionBlocked = true
                setTimeout(() => {
                    hideCard(card.id)
                    hideCard(_prevSelectedCard.id)
                    _isUserSelectionBlocked = false

                    // (4)Fourth step: clean previous selection
                    _prevSelectedCard = null
                }, 1000)
            }
        }

        // (5)Last step: Game over
        if (_renderSet.every(row => row.every(card => card.isActive))) {
            handlers.click({initiator: 'memory-playground-final'})
        }
    }

    const setScreen = (type, payload = {}) => {
        switch (type) {
            case templateTitles.playground: {
                const proportions = _initialData.struct.playground.cardProportions
                const [cellCount, rowCount] = _initialData.struct.playground.cardLayout.split('x').map(x => Number(x))

                _wrapperElement.innerHTML = M.render(templates.playground, {
                    //playground
                    renderSet: _renderSet,
                    rowHeight: `${calculateCardSideSize(_wrapperElement.offsetWidth, rowCount, CARD_PROPORTIONS_HEIGHT[proportions])}px`,
                    cellWidth: `${calculateCardSideSize(_wrapperElement.offsetWidth, cellCount, CARD_PROPORTIONS_HEIGHT[proportions])}px`,
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
                    callToActionButton: _initialData.callToActionEnabled,
                    callToActionButtonText: _initialData.callToActionText,
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
                case 'memory-cover-start': {
                    _isShowCover = !_isShowCover
                    setScreen(templateTitles.playground)
                    updateEventListeners()
                    sendAction('memory-cover-start')
                    break;
                }
                case 'memory-feedback-next': {
                    _isShowFeedBack = !_isShowFeedBack
                    setScreen(templateTitles.playground, payload)
                    updateEventListeners()
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
                    updateEventListeners()
                    sendAction('memory-playground-final')
                    break;
                }
                case 'memory-start':
                case 'memory-final-screen-restart': {
                    const {isShowCover, cardLayout, cardBackImage} = _initialData.struct.playground;
                    const {pairList} = _initialData.struct.pairs;
                    _isShowCover = isShowCover
                    _isShowFeedBack = false
                    _renderSet = getCardsDataSet(cardLayout, pairList, cardBackImage)
                    console.log(_renderSet)
                    setScreen(templateTitles.playground)
                    updateEventListeners()
                    if (initiator === 'memory-final-screen-restart') {
                        sendAction('memory-final-screen-restart')
                    }
                    break;
                }
                default:
                    break;
            }
        }
    }

    return {
        render: data => {
            console.log('data', data)
            try {
                _initialData = data
                const wrapperId = `mq_${data.id}`
                const wrapper = M.render(templates.wrapper, {id: wrapperId})

                methods.add(cnt, wrapper, data.t)

                _wrapperElement = document.getElementById(wrapperId)
                handlers.click({initiator: 'memory-start'})
            } catch (err) {
                log('error', '11 (MemoryCards)', data.id, null, err)
            }
        },
        postRender: null
    }
}