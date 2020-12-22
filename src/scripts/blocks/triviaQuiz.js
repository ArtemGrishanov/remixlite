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
            <div class="box">
                <div class="header">{{cover.h}}</div>
                <div class="description">{{cover.d}}</div>
                <div class="btn-wrap">
                    <div class="button-block">
                        <button class="is-handled" data-handlers="click" data-initiator="cover.start" style="background-color: {{colorTheme}}; color: {{buttonColor}}">
                            {{cover.bT}}
                        </button>
                    </div>
                </div>
                {{#cover.iD}}
                    <div class="image-disclaimer">
                        {{cover.iD}}
                    </div>
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
                    <div class="text size--{{sizes.t}}">{{question.t}}</div>
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
            <ul class="list">
                {{#question.a}}
                    <li class="item is-handled" data-handlers="click" data-initiator="question.answer" data-answer-id="{{id}}">
                        {{t}}
                    </li>
                {{/question.a}}
            </ul>
            {{#question.i}}
                {{#question.iD}}
                    <div class="image-disclaimer">
                        {{question.iD}}
                    </div>
                {{/question.iD}}
            {{/question.i}}
        </div>
    `,
    'question.answer.description': `
        <p class="description">
            {{.}}
        </p>
    `,
    'question.next': `
        <div class="button-block">
            <button class="is-handled" data-handlers="click" data-initiator="question.next" style="background-color: {{colorTheme}}; color: {{buttonColor}}">
                {{text}}
            </button>
        </div>
    `,
    result: `
        <div class="result" id="{{result.id}}">
            {{#header}}
                <div class="head">{{header}}</div>
            {{/header}}
            {{#result.i}}
                <img src="{{result.i}}" alt="Result image">
            {{/result.i}}
            <div class="box">
                {{#showScores}}
                    <div class="counter">{{scores.current}}/{{scores.all}}</div>
                {{/showScores}}
                <div class="header">{{result.h}}</div>
                <div class="description">{{result.d}}</div>
                <div class="btn-wrap">
                    <div class="button-block">
                        <button class="is-handled" data-handlers="click" data-initiator="result.restart">
                           Restart
                        </button>
                    </div>
                </div>
                {{#result.iD}}
                    <div class="image-disclaimer">
                        {{result.iD}}
                    </div>
                {{/result.iD}}
            </div>
        </div>
    `
}

function getParsedHTML(M, templateName, view) {
    return M.render(templates[templateName], view);
}

export default function(cnt, { M, methods }) {
    let wrapperElement = null
    let initialData, jsonStruct
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

    function setScreen(type, payload = {}) {
        switch (type) {
            case 'cover': {
                wrapperElement.innerHTML = getParsedHTML(M, 'cover', {
                    cover: jsonStruct.c,
                    colorTheme: initialData.cT,
                    buttonColor: invertColor(initialData.cT, true)
                });
                break;
            }
            case 'question': {
                wrapperElement.innerHTML = getParsedHTML(M, 'question', {
                    question: jsonStruct.q[payload.index],
                    sizes: {
                        t: jsonStruct.q[payload.index].t.length <= 100 ? 'big' : jsonStruct.q[payload.index].i ? 'small' : 'medium'
                    },
                    colorTheme: initialData.cT,
                    progressBar: initialData.pB,
                    counter: {
                        current: payload.index + 1,
                        all: jsonStruct.q.length
                    }
                });
                break;
            }
            case 'result': {
                wrapperElement.innerHTML = getParsedHTML(M, 'result', {
                    result: jsonStruct.r[payload.index],
                    header: jsonStruct._s.c ? jsonStruct.c.h : null,
                    colorTheme: initialData.cT,
                    showScores: initialData.sR,
                    scores: {
                        current: scores,
                        all: jsonStruct.q.length
                    }
                });
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

                    const selectedAnswer = jsonStruct.q[payload.qIndex].a.find(el => el.id === payload.answerId)
                    const selectedAnswerElement = Array.from(answers).filter(el => el.dataset.answerId === payload.answerId)[0];
                    selectedAnswerElement.classList.add("is-selected");

                    if (selectedAnswer && selectedAnswer.isC) {
                        selectedAnswerElement.classList.add("is-correct");
                        scores ++
                    } else {
                        selectedAnswerElement.classList.add("is-incorrect")
                        const correctAnswers = jsonStruct.q[payload.qIndex].a.filter(el => el.isC)
                        for (const correctAnswer of correctAnswers) {
                            const correctAnswerElement = Array.from(answers).filter(el => el.dataset.answerId === correctAnswer.id)[0];
                            correctAnswerElement.classList.add("is-correct");
                        }
                    }

                    if (selectedAnswer.d.length) {
                        selectedAnswerElement.insertAdjacentHTML('beforeEnd', getParsedHTML(M, 'question.answer.description', selectedAnswer.d))
                    }

                    wrapperElement.getElementsByClassName('list')[0].insertAdjacentHTML('afterEnd', getParsedHTML(M, 'question.next', {
                        text: payload.qIndex === (jsonStruct.q.length - 1) ? "See result" : "Next",
                        colorTheme: initialData.cT,
                        buttonColor: invertColor(initialData.cT, true)
                    }))

                    updateEventListeners({qIndex: payload.qIndex})
                    break;
                }
                case 'question.next': {
                    if (evt) evt.preventDefault()

                    if (payload.qIndex === (jsonStruct.q.length - 1)) {
                        const resultIndex = jsonStruct._s.d.findIndex(el => el.f <= scores && el.t >= scores)
                        setScreen('result', {index: resultIndex})
                        updateEventListeners()
                    } else {
                        setScreen('question', {index: payload.qIndex + 1})
                        updateEventListeners({qIndex: payload.qIndex + 1})
                    }

                    break;
                }
                case 'start':
                case 'result.restart': {
                    if (evt) evt.preventDefault()

                    switch (initiator) {
                        case 'start':
                            // Initial start action
                            break;
                        case 'result.restart':
                            // Restart action
                            break;
                        default:
                            break;
                    }

                    scores = 0
                    lastAnsweredIndex = null

                    let additionalPayload = {}
                    if (jsonStruct._s.c && initiator === 'start') { // need initiator === 'start' ?
                        setScreen('cover' )
                    } else {
                        setScreen('question', {index: 0})
                        additionalPayload.qIndex = 0
                    }

                    updateEventListeners(additionalPayload)
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
                jsonStruct = JSON.parse(data.struct)
                if (jsonStruct._isV) {
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
                    log('warn', data.id, 'Block will not render because "data.struct._isV" is FALSE.')
                }
            } catch (err) {
                log('warn', data.id, 'Block will not render because "data.struct" not JSON.')
            }
        },
        postRender: null
    }
}

