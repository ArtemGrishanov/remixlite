import Mustache from 'mustache'

// Import blocks Enums
import BLOCK from "./blocks/blocksEnum"
import BLOCK_NAMES_DICTIONARY from "./blocks/blockNamesEnum";
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
import blockTimeline from './blocks/timeline'

// Import UI
import uiModal from './ui/modal'
import uiPin from './ui/pin'
import uiButton from './ui/button'

import BlocksNavigation from "./utils/navigation/blocksNavigation";

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
        // Timeline
        [BLOCK.timeline]: (container, blockOptions) => blockTimeline(
            container,
            {
                add: this.#addBlock,
                parse: this.#parse,
                useFont: this.#useFont,
            },
            blockOptions,
        ),
    }
    #timelineLastBlockId;
    #navigator = new BlocksNavigation(sendMessage);

    constructor() {}

    // Public methods
    init = (container, projectStructure = {}) => {
        this.#forAllStringProperties(projectStructure, this.#htmlDecode)

        this.#container = container
        this.#projectStructure = projectStructure

        container.innerHTML = ''

        if (projectStructure.hasOwnProperty('blocks')) {
            this.#processBlocks(projectStructure.blocks);
            projectStructure.blocks.forEach(blockData => {
                const block = this.#blocks[blockData.t];
                if (block) {
                    const newBlock = new block(container, this.#getBlockOptions(blockData))
                    newBlock.render(blockData)
                    if (newBlock.postRender) newBlock.postRender()
                } else {
                    console.warn(`Block type "${blockData.t}" not supported`)
                }
            });
            this.#navigator.start(container);
        }
    }

    // Private methods
    #addBlock = (container, html, blockType, classes, props = null, navigationLabel = null) => {
        const div = document.createElement('div')

        if (blockType) {
            div.classList.add(
                'block',
                '__' + blockType,
                BLOCK_NAMES_DICTIONARY[blockType] + '-block'
            );
        }
        if (classes) {
            div.classList.add(...classes);
        }

        if (props && props.styles) {
            for (const [key, value] of Object.entries(props.styles)) {
                div.style[key] = value;
            }
        }

        div.innerHTML = html
        container.appendChild(div)

        if (navigationLabel) {
            this.#navigator.addBlock(navigationLabel, div);
        }
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

    /**
     * Extension point. Allows to analyze project structure on-init
     * @param {Array} blocks
     */
    #processBlocks = blocks => {
        blocks.forEach(blockData => {
            if (blockData.t === BLOCK.timeline) {
                this.#timelineLastBlockId = blockData.id;
            }
        });
            // TODO Remove event listener on destroy
    }
    #getBlockOptions = blockData => {
        const options = {};
        switch (blockData.t) {
            case BLOCK.timeline:
                if (blockData.id === this.#timelineLastBlockId) {
                    options.isLastTimelineBlock = true;
                }
                return options;
            default:
                return undefined;
        }
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

                    const projectStructure = payload.projectStructure || JSON.parse(replacesValues.projectStructure)

                    const root = document.getElementById('remix-app-root');

                    root.style.backgroundColor = projectStructure.app.bg || '#fff'

                    R = new Remix()
                    R.init(root, projectStructure)

                    sendMessage('initialized', {
                        clientId,
                        projectStructure,
                        sizes: {
                            maxWidth: projectStructure.app.maxWidth || 800,
                            height: root.scrollHeight
                        }
                    })

                    const resizeObserver = new ResizeObserver(entries => {
                        // check mobile size
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
    let isThrottled = false,
        savedArgs,
        savedThis;

    function wrapper() {
        if (isThrottled) {
            savedArgs = arguments;
            savedThis = this;
            return;
        }
        func.apply(this, arguments);
        isThrottled = true;
        setTimeout(function() {
            isThrottled = false;
            if (savedArgs) {
                wrapper.apply(savedThis, savedArgs);
                savedArgs = savedThis = null;
            }
        }, waitTime);
    }

    return wrapper;
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
