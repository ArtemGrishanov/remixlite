import invertColor from "../utils/invertColor";

// Log function
function log(type = 'log', blockId = '[NO BLOCK ID]', message = '[NO ERROR MESSAGE]', data = null) {
    console[type](`[RemixLite | Block type: 9 (TriviaQuiz), ID: ${blockId}] ${message}`, data ? data : '');
}

// Templates
const templates = {
    wrapper: `
        <div class="wrapper" id="{{id}}"></div>
    `,
    cover: `
        <div class="cover">
            {{#cover.i}}
                <img src="{{cover.i}}" alt="Cover image">
            {{/cover.i}}
            <div class="box {{_classes.box}}">
                <div class="header">{{cover.h}}</div>
                <div class="description">{{cover.d}}</div>
                <div class="btn-wrap">
                    <div class="button-block">
                        <button class="is-handled" data-handlers="click" data-initiator="cover.start" style="background-color: {{colorTheme}}; color: {{buttonColor}}">{{cover.bT}}</button>
                    </div>
                </div>
                {{#cover.iD}}
                    <div class="image-disclaimer">{{cover.iD}}</div>
                {{/cover.iD}}
            </div>
        </div>
    `,
    question: `
        <div class="question" id="{{question.id}}">
            {{#question.i}}
                <div class="img">
                    {{#progressBar}}
                        <span class="counter">{{counter.current}}/{{counter.all}}</span>
                    {{/progressBar}}
                    <img src="{{question.i}}" alt="Question image">
                    <div class="text-wrap">
                        <div class="text size--{{sizes.t}}">{{question.t}}</div>
                    </div>
                </div>
            {{/question.i}}
            {{^question.i}}
                <div class="no-img">
                    {{#progressBar}}
                        <span class="counter">{{counter.current}}/{{counter.all}}</span>
                    {{/progressBar}}
                    <div class="text size--{{sizes.t}}">{{question.t}}</div>
                </div>
            {{/question.i}}
            <ul class="list {{_classes.qList}}">
                {{#question.a}}
                    <li class="item is-handled {{_classes.a}}" data-handlers="click" data-initiator="question.answer" data-answer-id="{{id}}">
                        {{#isText}}
                            <div class="text">{{t}}</div>
                        {{/isText}}
                        {{^isText}}
                            <div class="image">
                                <img src="{{i}}" alt="img">
                                <p>{{iL}}</p>
                            </div>
                        {{/isText}}
                    </li>
                {{/question.a}}
            </ul>
            {{#question.i}}
                {{#question.iD}}
                    <div class="image-disclaimer">{{question.iD}}</div>
                {{/question.iD}}
            {{/question.i}}
        </div>
    `,
    'question.answer.description': `
        <p class="description">{{.}}</p>
    `,
    'question.next': `
        <div class="button-block">
            <button class="is-handled" data-handlers="click" data-initiator="question.next" style="background-color: {{colorTheme}}; color: {{buttonColor}}">{{text}}</button>
        </div>
    `,
    result: `
        <div class="result" id="{{result.id}}">
            {{#header}}
                <div class="head-wrap {{_classes.head-wrap}}">
                    <div class="head">{{header}}</div>
                </div>
            {{/header}}
            {{#result.i}}
                <img src="{{result.i}}" alt="Result image">
            {{/result.i}}
            <div class="box {{_classes.box}}">
                {{#showScores}}
                    <div class="counter">{{scores.current}}/{{scores.all}}</div>
                {{/showScores}}
                <div class="header">{{result.h}}</div>
                <div class="description">{{result.d}}</div>
                <div class="btn-wrap">
                    {{#callToActionButton}}
                        <div class="link-block">
                            <button class="is-handled" data-handlers="click" data-initiator="result.callToAction" style="background-color: {{colorTheme}}; color: {{buttonColor}}">{{callToActionButtonText}}</button>
                        </div>
                    {{/callToActionButton}}
                    <div class="button-block">
                        <button class="is-handled" data-handlers="click" data-initiator="result.restart">Restart</button>
                    </div>
                </div>
                {{#result.iD}}
                    <div class="image-disclaimer">{{result.iD}}</div>
                {{/result.iD}}
            </div>
        </div>
    `
}

function getParsedHTML(M, templateName, view) {
    return M.render(templates[templateName], view);
}

export default function(cnt, { M, methods, sendMessage }) {
    let wrapperElement = null
    let initialData = {}
    let scores = 0
    let lastAnsweredIndex = null

    // How to use "iframePosition"
    // window.addEventListener("message", ({data = {}}) => {
    //     const { method, payload = {} } = data
    //     switch (method) {
    //         case 'iframePosition': {
    //             console.log('iframePosition:', payload);
    //             break;
    //         }
    //         default:
    //             break;
    //     }
    // }, false);

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

    function getCoords(elem) {
        const box = elem.getBoundingClientRect();
        return {
            top: box.top,
            left: box.left
        };
    }

    function setScreen(type, payload = {}) {
        switch (type) {
            case 'cover': {
                wrapperElement.innerHTML = getParsedHTML(M, 'cover', {
                    cover: initialData.struct.c,
                    colorTheme: initialData.cT,
                    buttonColor: invertColor(initialData.cT, true),
                    _classes: {
                        box: initialData.struct.c.i ? '' : 'no-image'
                    }
                });

                sendMessage('scrollParent', {
                    top: getCoords(wrapperElement).top - 20 // 20 = top offset
                })
                break;
            }
            case 'question': {
                const question = initialData.struct.q[payload.index]

                wrapperElement.innerHTML = getParsedHTML(M, 'question', {
                    question,
                    isText: question.isT,
                    sizes: {
                        t: question.t.length <= 100 ? 'big' : question.i ? 'small' : 'medium'
                    },
                    colorTheme: initialData.cT,
                    progressBar: initialData.pB,
                    counter: {
                        current: payload.index + 1,
                        all: initialData.struct.q.length
                    },
                    _classes: {
                        qList: !question.isT ? 'is-image' : '',
                        a: !question.isT ? `is-image${(question.a.length <= 3 || (question.a.length >= 5 && question.a.length <= 6)) ? ' is-big' : ''}` : '',
                    }
                });

                sendMessage('scrollParent', {
                    top: getCoords(wrapperElement).top - 20 // 20 = top offset
                })
                break;
            }
            case 'result': {
                const result = initialData.struct.r[payload.index]

                wrapperElement.innerHTML = getParsedHTML(M, 'result', {
                    result,
                    header: initialData.struct._s.c ? initialData.struct.c.h : null,
                    colorTheme: initialData.cT,
                    buttonColor: invertColor(initialData.cT, true),
                    showScores: initialData.sR,
                    callToActionButton: initialData.cA,
                    callToActionButtonText: initialData.cA_t,
                    scores: {
                        current: scores,
                        all: initialData.struct.q.length
                    },
                    _classes: {
                        'head-wrap': !result.i ? 'no-image' : '',
                        box: !result.i ? 'no-image' : '',
                    }
                });

                sendMessage('scrollParent', {
                    top: getCoords(wrapperElement).top - 20 // 20 = top offset
                })
                break;
            }
            default:
                break;
        }
    }

    const handlers = {
        click: ({initiator, payload}, evt) => {
            switch (initiator) {
                case 'cover.start': {
                    if (evt) evt.preventDefault()

                    setScreen('question', {index: 0})
                    updateEventListeners({qIndex: 0})

                    sendMessage('action', {
                        block: 'triviaQuiz',
                        id: initialData.id,
                        type: 'click',
                        data: {
                            target: 'cover.start'
                        }
                    })
                    break;
                }
                case 'question.answer': {
                    if (evt) evt.preventDefault()

                    if (lastAnsweredIndex === payload.qIndex) {
                        return
                    }

                    lastAnsweredIndex = payload.qIndex;
                    const answers = wrapperElement.querySelectorAll('[data-initiator="question.answer"]');
                    for (const el of answers) {
                        el.classList.add("is-disabled");
                    }

                    const question = initialData.struct.q[payload.qIndex]

                    const selectedAnswer = question.a.find(el => el.id === payload.answerId)
                    const selectedAnswerElement = Array.from(answers).filter(el => el.dataset.answerId === payload.answerId)[0];
                    selectedAnswerElement.classList.add("is-selected");

                    if (selectedAnswer && selectedAnswer.isC) {
                        selectedAnswerElement.classList.add("is-correct");
                        scores ++
                    } else {
                        selectedAnswerElement.classList.add("is-incorrect")
                        const correctAnswers = question.a.filter(el => el.isC)
                        for (const correctAnswer of correctAnswers) {
                            const correctAnswerElement = Array.from(answers).filter(el => el.dataset.answerId === correctAnswer.id)[0];
                            correctAnswerElement.classList.add("is-correct");
                        }
                    }

                    const description = question.isT ? selectedAnswer.d : selectedAnswer.iDr
                    if (description.length) {
                        selectedAnswerElement.insertAdjacentHTML('beforeEnd', getParsedHTML(M, 'question.answer.description', description))
                    }

                    wrapperElement.getElementsByClassName('list')[0].insertAdjacentHTML('afterEnd', getParsedHTML(M, 'question.next', {
                        text: payload.qIndex === (initialData.struct.q.length - 1) ? "See result" : "Next",
                        colorTheme: initialData.cT,
                        buttonColor: invertColor(initialData.cT, true)
                    }))

                    updateEventListeners({qIndex: payload.qIndex})
                    break;
                }
                case 'question.next': {
                    if (evt) evt.preventDefault()

                    if (payload.qIndex === (initialData.struct.q.length - 1)) {
                        const resultIndex = initialData.struct._s.d.findIndex(el => el.f <= scores && el.t >= scores)
                        setScreen('result', {index: resultIndex})
                        updateEventListeners()

                        sendMessage('action', {
                            block: 'triviaQuiz',
                            id: initialData.id,
                            type: 'setScreen',
                            data: {
                                target: 'result',
                                payload: {
                                    scores,
                                    maxScores: initialData.struct.q.length,
                                    resultScreen: initialData.struct.r[resultIndex]
                                }
                            }
                        })
                    } else {
                        setScreen('question', {index: payload.qIndex + 1})
                        updateEventListeners({qIndex: payload.qIndex + 1})

                        sendMessage('action', {
                            block: 'triviaQuiz',
                            id: initialData.id,
                            type: 'setScreen',
                            data: {
                                target: 'question'
                            }
                        })
                    }

                    break;
                }
                case 'start':
                case 'result.restart': {
                    if (evt) evt.preventDefault()

                    scores = 0
                    lastAnsweredIndex = null

                    let additionalPayload = {}
                    if (initialData.struct._s.c) {
                        setScreen('cover' )
                    } else {
                        setScreen('question', {index: 0})
                        additionalPayload.qIndex = 0
                    }

                    updateEventListeners(additionalPayload)

                    switch (initiator) {
                        case 'start':
                            // Quiz was rendered
                            break;
                        case 'result.restart':
                            sendMessage('action', {
                                block: 'triviaQuiz',
                                id: initialData.id,
                                type: 'click',
                                data: {
                                    target: 'result.restart'
                                }
                            })
                            break;
                        default:
                            break;
                    }
                    break;
                }
                case 'result.callToAction': {
                    sendMessage('action', {
                        block: 'triviaQuiz',
                        id: initialData.id,
                        type: 'click',
                        data: {
                            target: 'result.callToAction'
                        }
                    })
                    window.open(initialData.cA_l,'_blank');
                    break;
                }
                default:
                    break;
            }
        },
        // mousemove etc.
    }

    return {
        render: data => {
            initialData = data
            if (initialData.struct._isV) {
                try {
                    const wrapperId = `tq_${data.id}`
                    const wrapper = getParsedHTML(M, 'wrapper', {id: wrapperId})

                    methods.add(cnt, wrapper, data.t)

                    wrapperElement = document.getElementById(wrapperId)

                    handlers.click({initiator: 'start', payload: {}})
                } catch (err) {
                    log('error', data.id, null, err)
                }
            } else {
                log('warn', data.id, 'Block will not render because "data.struct._isV" is not true.')
            }
        },
        postRender: null
    }
}

