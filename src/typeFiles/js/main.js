import Mustache from 'mustache'

import { setLanguage, getTranslation } from './i18n'

// Import blocks Enum
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
import blockMemoryCards from './blocks/memoryCards/memoryCards'
import blockTimeline from './blocks/timeline'
import blockCards from './blocks/cards'

// Import UI
import uiModal from './ui/modal'
import uiPin from './ui/pin'
import uiButton from './ui/button'
//Import Utils
import throttle from "./utils/throttle";
import getRandomId from "./utils/getRandomId";
import log from "./utils/log";

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
            sendMessage,
            getTranslation,
        }),
        // Then\Now
        [BLOCK.thenNow]: container => blockThenNow(container, {
            methods: {
                add: this.#addBlock,
                parse: this.#parse,
            }
        }),
        // Memory cards
        [BLOCK.memoryCards]: container => blockMemoryCards(container, {
            M: Mustache,
            methods: {
                add: this.#addBlock,
                parse: this.#parse,
            },
            sendMessage,
            getTranslation
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
        [BLOCK.cookies]: container => blockCards(container, {
            M: Mustache,
            methods: {
                add: this.#addBlock,
                parse: this.#parse,
            },
            sendMessage,
            getTranslation
        }),
        [BLOCK.horoscope]: container => blockCards(container, {
            M: Mustache,
            methods: {
                add: this.#addBlock,
                parse: this.#parse,
            },
            sendMessage,
            getTranslation
        }),
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
                    try {
                        newBlock.render(blockData)
                    }
                    catch (err) {
                        log('error', blockData.t, blockData.id, null, err)
                    }
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
    }

    /**
     * Get options for specific block. Allows to pass some data into the block component before it renders
     * @param blockData
     * @returns {Object|undefined} Block options
     */
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

                    setLanguage(payload.lng)

                    const root = document.getElementById('remix-app-root');

                    root.style.backgroundColor = projectStructure.app.bg || '#fff'

                    R = new Remix()
                    R.init(root, projectStructure)

                    sendMessage('initialized', {
                        clientId,
                        projectStructure,
                        sizes: {
                            maxWidth: projectStructure.app.maxWidth ? Number(projectStructure.app.maxWidth) : 800,
                            height: root.scrollHeight
                        }
                    })

                    const isPreviewMode = payload.mode === 'preview';
                    const mobilePreviewStateCssClass = 'is-mobile-preview';

                    const resizeObserver = new ResizeObserver(entries => {
                        const target = entries[0].target;

                        if (isPreviewMode) {
                            if (target.clientWidth < 700) {
                                root.classList.add(mobilePreviewStateCssClass);
                            } else {
                                root.classList.remove(mobilePreviewStateCssClass);
                            }
                        }
                        sendMessage('setSize', {
                            sizes: {
                                height: target.scrollHeight
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
