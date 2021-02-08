import log from "../utils/log";
import invertColor from "../utils/invertColor";

const templates = {
    wrapper: `
        <div class="memory-cards-wrapper" id="{{id}}"></div>
    `,
    playground: `
        <div class="memory-playground">
            <div class="memory-playground__rows-wrapper">
                {{#stooges}}
                    <div class="memory-card__row">
                    </div>
                {{/stooges}}
            </div>
            <button class="is-handled" data-handlers="click" data-initiator="memory-cover-start">Cover</button>
            <button class="is-handled" data-handlers="click" data-initiator="memory-feedback-next">Feed back</button>
            <button class="is-handled" data-handlers="click" data-initiator="memory-playground-final">Final</button>
                    
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
                 <button class="memory-playground__cover-btn is-handled" data-handlers="click" data-initiator="memory-final-screen-restart">Restart</button>
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
    feedBack: "feedBack",
    finalScreen: "finalScreen",
}

export default function (cnt, {M, methods, sendMessage}) {
    let wrapperElement = null
    let initialData = null
    let isShowCover = false
    let isShowFeedBack = false

    // Pre-parse (for high speed loading)
    for (const template of Object.values(templates)) {
        M.parse(template)
    }

    function updateEventListeners(additionalPayload = {}) {
        if (wrapperElement) {
            const handledElements = wrapperElement.getElementsByClassName("is-handled");
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

    function sendAction(target) {
        sendMessage('action', {
            block: 'memoryCards',
            id: initialData.id,
            type: 'click',
            data: {
                target
            }
        })
    }

    function setScreen(type, payload = {}) {
        switch (type) {
            case templateTitles.playground: {
                wrapperElement.innerHTML = M.render(templates.playground, {
                    //playground
                    cardLayout: initialData.struct.playground.cardLayout,
                    cardBackImage: initialData.struct.playground.cardBackImage,
                    cardProportions: initialData.struct.playground.cardProportions,
                    // cover
                    isShowCover: isShowCover,
                    coverHeader: initialData.struct.playground.coverHeader,
                    coverButtonText: initialData.struct.playground.coverButtonText,
                    // feedBack
                    isShowFeedBack: isShowFeedBack,
                    pair: payload,
                    // general
                    colorTheme: initialData.colorTheme,
                    buttonColor: invertColor(initialData.colorTheme, true),
                });

                break;
            }
            case templateTitles.finalScreen: {
                wrapperElement.innerHTML = M.render(templates.finalScreen, {
                    header: initialData.struct.finalScreen.header,
                    description: initialData.struct.finalScreen.description,
                    imageSrc: initialData.struct.finalScreen.imageSrc,
                    imageDisclaimer: initialData.struct.finalScreen.imageDisclaimer,
                    _classes: {
                        content: initialData.struct.finalScreen.imageSrc ? '' : 'no-image'
                    }
                });

                break;
            }
            default:
                log('error', '11 (MemoryCards)', initialData.id, `Screen type not detected - ${type}`)
                break;
        }
    }

    const handlers = {
        click: ({initiator, payload}, evt) => {
            if (evt) evt.preventDefault()
            switch (initiator) {
                case 'memory-cover-start': {
                    isShowCover = !isShowCover
                    setScreen(templateTitles.playground)
                    updateEventListeners()
                    sendAction('memory-cover-start')
                    break;
                }
                case 'memory-feedback-next': {
                    isShowFeedBack = !isShowFeedBack
                    setScreen(templateTitles.playground, initialData.struct.pairs.pairList[0])
                    updateEventListeners()
                    sendAction('memory-feedback-next')
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
                    isShowCover = initialData.struct.playground.isShowCover
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
                initialData = data
                const wrapperId = `mq_${data.id}`
                const wrapper = M.render(templates.wrapper, {id: wrapperId})

                methods.add(cnt, wrapper, data.t)

                wrapperElement = document.getElementById(wrapperId)
                handlers.click({initiator: 'memory-start', payload: {}})
            } catch (err) {
                log('error', '11 (MemoryCards)', data.id, null, err)
            }
        },
        postRender: null
    }
}