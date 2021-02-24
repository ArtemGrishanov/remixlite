import log from "../utils/log";
import invertColor from "../utils/invertColor";

// Templates
const templates = {
    wrapper: `
        <div class="wrapper" id="{{id}}"></div>
    `,
    cover: `
        <div class="cover">
            {{#cover.image}}
                <img src="{{cover.image}}" alt="Cover image">
            {{/cover.image}}
            <div class="box {{_classes.box}}">
                <div class="header">{{cover.header}}</div>
                <div class="description">{{cover.description}}</div>
                <div class="btn-wrap">
                    <div class="button-block">
                        <button class="is-handled" data-handlers="click" data-initiator="cover.start" style="background-color: {{colorTheme}}; color: {{buttonColor}}">{{cover.buttonText}}</button>
                    </div>
                </div>
                {{#cover.imageDisclaimer}}
                    <div class="image-disclaimer">{{cover.imageDisclaimer}}</div>
                {{/cover.imageDisclaimer}}
            </div>
        </div>
    `,
    question: `
        <div class="question" id="{{question.id}}">
            {{#question.image}}
                <div class="img">
                    {{#progressBar}}
                        <span class="counter">{{counter.current}}/{{counter.all}}</span>
                    {{/progressBar}}
                    <img src="{{question.image}}" alt="Question image">
                    <div class="text-wrap">
                        <div class="text size--{{sizes.t}}">{{question.text}}</div>
                    </div>
                </div>
            {{/question.image}}
            {{^question.image}}
                <div class="no-img">
                    {{#progressBar}}
                        <span class="counter">{{counter.current}}/{{counter.all}}</span>
                    {{/progressBar}}
                    <div class="text size--{{sizes.t}}">{{question.text}}</div>
                </div>
            {{/question.image}}
            <ul class="list {{_classes.answerList}}">
                {{#question.answers}}
                    <li class="item is-handled {{_classes.answer}}" data-handlers="click" data-initiator="question.answer" data-answer-id="{{id}}">
                        {{#isText}}
                            <div class="hover-border" style="border-color: {{colorTheme}}"></div>
                            <div class="text">{{text}}</div>
                        {{/isText}}
                        {{^isText}}
                            <div class="image">
                                <img src="{{image}}" alt="img">
                                <p>{{imageLabel}}</p>
                            </div>
                        {{/isText}}
                    </li>
                {{/question.answers}}
            </ul>
            {{#question.image}}
                {{#question.imageDisclaimer}}
                    <div class="image-disclaimer">{{question.imageDisclaimer}}</div>
                {{/question.imageDisclaimer}}
            {{/question.image}}
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
            {{#result.image}}
                <img src="{{result.image}}" alt="Result image">
            {{/result.image}}
            <div class="box {{_classes.box}}">
                {{#showScores}}
                    <div class="counter">{{scores.current}}/{{scores.all}}</div>
                {{/showScores}}
                <div class="header">{{result.header}}</div>
                <div class="description">{{result.description}}</div>
                <div class="btn-wrap">
                    {{#callToActionButton}}
                        <div class="link-block">
                            <button class="is-handled" data-handlers="click" data-initiator="result.callToAction" style="background-color: {{colorTheme}}; color: {{buttonColor}}">{{callToActionButtonText}}</button>
                        </div>
                    {{/callToActionButton}}
                    <div class="button-block">
                        <button class="is-handled" data-handlers="click" data-initiator="result.restart">{{restartText}}</button>
                    </div>
                </div>
                {{#result.imageDisclaimer}}
                    <div class="image-disclaimer">{{result.imageDisclaimer}}</div>
                {{/result.imageDisclaimer}}
            </div>
        </div>
    `
}

function getParsedHTML(M, templateName, view) {
    return M.render(templates[templateName], view);
}

export default function(cnt, { M, methods, sendMessage, getTranslation }) {
    let wrapperElement = null
    let initialData = {}
    let scores = 0
    let lastAnsweredIndex = null

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
                    cover: initialData.struct.cover,
                    colorTheme: initialData.colorTheme,
                    buttonColor: invertColor(initialData.colorTheme, true),
                    _classes: {
                        box: initialData.struct.cover.image ? '' : 'no-image'
                    }
                });

                sendMessage('scrollParent', {
                    top: getCoords(wrapperElement).top - 20 // 20 = top offset
                })
                break;
            }
            case 'question': {
                const question = initialData.struct.questions[payload.index]

                wrapperElement.innerHTML = getParsedHTML(M, 'question', {
                    question,
                    isText: question.isText,
                    sizes: {
                        t: question.text.length <= 100 ? 'big' : question.image ? 'small' : 'medium'
                    },
                    colorTheme: initialData.colorTheme,
                    progressBar: initialData.progressBar,
                    counter: {
                        current: payload.index + 1,
                        all: initialData.struct.questions.length
                    },
                    _classes: {
                        answerList: !question.isText ? 'is-image' : '',
                        answer: !question.isText ? `is-image${(question.answers.length <= 3 || (question.answers.length >= 5 && question.answers.length <= 6)) ? ' is-big' : ''}` : '',
                    }
                });

                sendMessage('scrollParent', {
                    top: getCoords(wrapperElement).top - 20 // 20 = top offset
                })
                break;
            }
            case 'result': {
                const result = initialData.struct.results[payload.index]

                wrapperElement.innerHTML = getParsedHTML(M, 'result', {
                    result,
                    header: initialData.struct._settings.showCover ? initialData.struct.cover.header : null,
                    colorTheme: initialData.colorTheme,
                    buttonColor: invertColor(initialData.colorTheme, true),
                    showScores: initialData.showScores,
                    callToActionButton: initialData.callToActionEnabled,
                    callToActionButtonText: initialData.callToActionText,
                    restartText: getTranslation('Restart'),
                    scores: {
                        current: scores,
                        all: initialData.struct.questions.length
                    },
                    _classes: {
                        'head-wrap': !result.image ? 'no-image' : '',
                        box: !result.image ? 'no-image' : '',
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

                    const question = initialData.struct.questions[payload.qIndex]

                    const selectedAnswer = question.answers.find(el => el.id === payload.answerId)
                    const selectedAnswerElement = Array.from(answers).filter(el => el.dataset.answerId === payload.answerId)[0];
                    selectedAnswerElement.classList.add("is-selected");

                    if (selectedAnswer && selectedAnswer.isCorrect) {
                        selectedAnswerElement.classList.add("is-correct");
                        scores ++
                    } else {
                        selectedAnswerElement.classList.add("is-incorrect")
                        const correctAnswers = question.answers.filter(el => el.isCorrect)
                        for (const correctAnswer of correctAnswers) {
                            const correctAnswerElement = Array.from(answers).filter(el => el.dataset.answerId === correctAnswer.id)[0];
                            correctAnswerElement.classList.add("is-correct");
                        }
                    }

                    const description = question.isText ? selectedAnswer.description : selectedAnswer.imageDescription
                    if (description.length) {
                        selectedAnswerElement.insertAdjacentHTML('beforeEnd', getParsedHTML(M, 'question.answer.description', description))
                    }

                    wrapperElement.getElementsByClassName('list')[0].insertAdjacentHTML('afterEnd', getParsedHTML(M, 'question.next', {
                        text: payload.qIndex === (initialData.struct.questions.length - 1) ? getTranslation('See result') : getTranslation('Next'),
                        colorTheme: initialData.colorTheme,
                        buttonColor: invertColor(initialData.colorTheme, true)
                    }))

                    updateEventListeners({qIndex: payload.qIndex})
                    break;
                }
                case 'question.next': {
                    if (evt) evt.preventDefault()

                    if (payload.qIndex === (initialData.struct.questions.length - 1)) {
                        const resultIndex = initialData.struct._settings.distribution.findIndex(el => el.from <= scores && el.to >= scores)
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
                                    maxScores: initialData.struct.questions.length,
                                    resultScreen: initialData.struct.results[resultIndex]
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
                    if (initialData.struct._settings.showCover) {
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
                    window.open(initialData.callToActionLink,'_blank');
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
            try {
                const wrapperId = `tq_${data.id}`
                const wrapper = getParsedHTML(M, 'wrapper', {id: wrapperId})

                methods.add(cnt, wrapper, data.t)

                wrapperElement = document.getElementById(wrapperId)

                handlers.click({initiator: 'start', payload: {}})
            } catch (err) {
                log('error', '9 (TriviaQuiz)', data.id, null, err)
            }
        },
        postRender: null
    }
}

