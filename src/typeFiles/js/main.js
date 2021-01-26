import Mustache from 'mustache'

// Import blocks Enum
import BLOCK from "./blocks/blocksEnum"
// Import blocks
import blockText from './blocks/text'
import blockImage from './blocks/image'
import blockEmbedInteractyProject from './blocks/embedInteractyProject'
import blockFlipCard from './blocks/flipCard'
import blockEmbedYoutubeVideo from './blocks/embedYoutubeVideo'
import blockCtaButton from './blocks/ctaButton'
import blockZoomMap from './blocks/zoomMap'
import blockFindObject from './blocks/findObject'
import blockTriviaQuiz from './blocks/triviaQuiz'
import blockThenNow from './blocks/thenNow'
// Import UI
import uiModal from './ui/modal'
import uiPin from './ui/pin'
import uiButton from './ui/button'

const replacesValues = {
    isScreenshot: '{{IS_SERVER_SCREENSHOT}}',
    projectStructure: '{{PROJECT_STRUCTURE_JSON}}'
}

class Remix {
    #container
    #projectStructure

    #fonts = {
        list: [
            'Roboto',
            'Roboto Condensed',
            'Open Sans',
            "Open Sans Condensed",
            'Lato',
            'Montserrat',
            'Oswald',
            'Merriweather',
            'Ubuntu',
            'Lobster',
            'Pacifico',
            'Vollkorn',
            'Cuprum',
            'Alegreya Sans',
            'Russo One',
            'Playfair Display SC',
            'Alice',
            'Press Start 2P',
            'Bad Script',
            'Yeseva One',
            'Marmelad',
            'Rubik Mono One',
            'Raleway',
            'Roboto Slab',
            'Lora',
            'Seymour One',
            'Cormorant SC',
            'Literata',
            "Spectral",
            "Alegreya",
            "EB Garamond",
            "Bitter",
            "PT Serif",
            "Noto Sans"
        ],
        imported: {
            // 'Ubuntu': true | false
            // ...
        }
    }
    #UI = {
        modal: () => uiModal({
            methods: {
                add: this.#addBlock,
                parse: this.#parse
            },
            ui: {
                button: this.#UI.button
            }
        }),
        pins: {
            wrapper: uiPin.wrapper,
            item: uiPin.item
        },
        button: {
            colored: uiButton.colored
        }
    }
    #blocks = {
        // Text
        [BLOCK.text]: container => blockText(container, {
            methods: {
                add: this.#addBlock,
                parse: this.#parse,
                useFont: this.#useFont
            }
        }),
        // Image
        [BLOCK.image]: container => blockImage(container, {
            methods: {
                add: this.#addBlock,
                parse: this.#parse
            }
        }),
        // Embed Interacty project
        [BLOCK.embedInteractyProject]: container => blockEmbedInteractyProject(container, {
            methods: {
                add: this.#addBlock,
                parse: this.#parse
            }
        }),
        // Flip card
        [BLOCK.flipCards]: container => blockFlipCard(container, {
            methods: {
                add: this.#addBlock,
                parse: this.#parse
            }
        }),
        // Embed Youtube video
        [BLOCK.youtubeVideo]: container => blockEmbedYoutubeVideo(container, {
            methods: {
                add: this.#addBlock,
                parse: this.#parse
            }
        }),
        // CTA button
        [BLOCK.button]: container => blockCtaButton(container, {
            methods: {
                add: this.#addBlock,
                parse: this.#parse
            },
            ui: {
                button: this.#UI.button
            }
        }),
        // Zoom map
        [BLOCK.interactiveImage]: container => blockZoomMap(container, {
            methods: {
                add: this.#addBlock,
                parse:this.#parse,
                extend: this.#extend
            },
            ui: {
                modal: this.#UI.modal,
                pins: this.#UI.pins,
            }
        }),
        //  Find object
        [BLOCK.hiddenObjects]: container => blockFindObject(container, {
            methods: {
                add: this.#addBlock,
                parse: this.#parse,
                extend: this.#extend
            },
            ui: {
                modal: this.#UI.modal,
                pins: this.#UI.pins,
            }
        }),
        //  Trivia quiz
        [BLOCK.quiz]: container => blockTriviaQuiz(container, {
            M: Mustache,
            methods: {
                add: this.#addBlock,
                parse: this.#parse,
            },
            sendMessage
        }),
        // Then\Now
        [BLOCK.thenNow]: container => blockThenNow(container, {
            methods: {
                add: this.#addBlock,
                parse: this.#parse,
            }
        }),
    }

    constructor() {}

    // Public methods
    init = (container, projectStructure = {}) => {
        this.#forAllStringProperties(projectStructure, this.#htmlDecode)

        this.#container = container
        this.#projectStructure = projectStructure

        container.innerHTML = ''

        if (projectStructure.hasOwnProperty('blocks')) {
            projectStructure.blocks.forEach(blockData => {
                const block = this.#blocks[blockData.t];
                if (block) {
                    const newBlock = new block(container)
                    newBlock.render(blockData)
                    if (newBlock.postRender) newBlock.postRender()
                } else {
                    console.warn(`Block type "${blockData.t}" not supported`)
                }
            });
        }
    }

    // Private methods
    #addBlock = (container, html, blockType, classes, props = null) => {
        const div = document.createElement('div')

        if (blockType) {
            div.classList = 'block __' + blockType
        }
        if (classes) {
            div.classList += classes
        }

        if (props && props.styles) {
            for (const [key, value] of Object.entries(props.styles)) {
                div.style[key] = value;
            }
        }

        div.innerHTML = html
        container.appendChild(div)
        return div
    }
    #parse = (template, data) => {
        for (const key in data) {
            const re = new RegExp(`{{${key}}}`, 'g')
            template = template.replace(re, data[key]);
        }
        return template
    }
    #addFont = family => {
        if (!this.#fonts.imported[family]) {
            const link = document.createElement('link')
            link.href = `https://fonts.googleapis.com/css2?family=${family}:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap`
            link.rel = 'stylesheet'
            document.getElementsByTagName('head')[0].append(link)
            this.#fonts.imported[family] = true
        }
    }
    #useFont = text => {
        this.#fonts.list.forEach((f, i) => {
            if (text.includes(`ql-font-${f.replace(/ /g, '')}`)) {
                this.#addFont(f)
            }
        })
    }
    #htmlDecode = str => {
        const chars = [`\n`,`\r`,`\``,`'`,`"`,`<`,`>`]
        chars.forEach(char => {
            const reg = new RegExp(`U\\+${char.charCodeAt(0)};`, 'g')
            str = str.replace(reg, char)
        })
        return str
    }
    #forAllStringProperties = (obj, fn) => {
        if (obj) {
            Object.keys(obj).forEach(k => {
                if (typeof obj[k] === 'string') {
                    obj[k] = fn(obj[k])
                }
                else if (typeof obj[k] === 'object') {
                    this.#forAllStringProperties(obj[k], fn)
                }
            })
        }
    }
    #extend = (o, p) => {
        for (const k in p) {
            if (p.hasOwnProperty(k)) o[k] = p[k]
        }
        return o
    }
}

let cntOrigin, cntSource, isInitialized = false, clientId = null, R = undefined
try {
    clientId = window.localStorage.getItem("CLIENT_ID");
    if (!clientId) {
        clientId = getRandomId(16)
        window.localStorage.setItem("CLIENT_ID", clientId)
    }
} catch (err) {
    clientId = getRandomId(16)
}
window.addEventListener("message", receiveMessage, false);
function receiveMessage({origin = null, data = {}, source = null}) {
    const { method, payload = {} } = data

    switch (method) {
        case 'init': {
            try {
                cntSource = source;
                cntOrigin = !origin ? '*' : origin;

                if (!isInitialized) {
                    isInitialized = true;

                    const projectStructure = JSON.parse(payload.projectStructure || replacesValues.projectStructure)

                    const root = document.getElementById('remix-app-root');

                    root.style.backgroundColor = projectStructure.app.bg || '#fff'

                    R = new Remix()
                    R.init(root, projectStructure)

                    sendMessage('initialized', {
                        clientId,
                        sizes: {
                            maxWidth: projectStructure.app.maxWidth || 800,
                            height: root.scrollHeight
                        },
                    })

                    const resizeObserver = new ResizeObserver(entries => {
                        sendMessage('setSize', {
                            sizes: {
                                height: entries[0].target.scrollHeight
                            }
                        })
                    })
                    resizeObserver.observe(root);

                    ['mousemove', 'mousedown', 'keydown'].forEach(evt => {
                        window.addEventListener(evt, throttle(() => sendMessage('activity', {}), 5000))
                    })
                }
            } catch (err) {
                console.error(err)
                sendMessage('initError')
            }
            break;
        }
        default:
            break;
    }
}
function sendMessage(method, payload = null) {
    if (cntSource) {
        cntSource.postMessage({
            method,
            payload
        }, cntOrigin);
    }
}
function getRandomId(t = 21) {
    let s = '', r = crypto.getRandomValues(new Uint8Array(t))
    for (; t--; ) {
        const n = 63 & r[t]
        s += n < 36 ? n.toString(36) : n < 62 ? (n - 26).toString(36).toUpperCase() : n < 63 ? '_' : '-'
    }
    return s
}
function throttle(func, waitTime) {
    let timeout = null
    return function (...args) {
        if (timeout === null) {
            func.apply(this, args)
            timeout = setTimeout(() => (timeout = null), waitTime)
        }
    }
}

/**
 * Hack for server screenshot (server is not inject loader file, that mean we need to send "init" method manually)
 */
if (replacesValues.isScreenshot === 'true') {
    try {
        receiveMessage({
            data: {
                method: 'init'
            }
        })
    } catch(err) {
        console.error(err);
    }
}
