import Mustache from 'mustache'

// Import blocks Enum
import BLOCK from "./blocks/blocksEnum";
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
// Import UI
import uiModal from './ui/modal'
import uiPin from './ui/pin'
import uiButton from './ui/button'

const RL = window.Remix || {};
window.Remix = RL;

/**
 * Firestarter
 */
let cntOrigin, cntSource, initialized = false;
let clientId = null
if (window && window.localStorage) {
    clientId = window.localStorage.getItem("CLIENT_ID");
    if (!clientId) {
        clientId = getRandomId(16)
        window.localStorage.setItem("CLIENT_ID", clientId)
    }
}
window.addEventListener("message", receiveMessage, false);
function receiveMessage({origin = null, data = {}, source = null}) {
    switch (data.method) {
        case 'init': {
            cntSource = source;
            cntOrigin = !origin ? '*' : origin;

            if (!initialized) {
                if (!window.Remix) {
                    sendMessage('init_error')
                    throw new Error('Remix app not loaded!');
                }

                initialized = true;

                const root = document.getElementById('remix-app-root');

                if (!data.payload.projectStructure) {
                    // Server replaces projectStructureJson (string) when publishing
                    data.payload.projectStructure = '{{PROJECT_STRUCTURE_JSON}}'
                }

                try {
                    data.payload.projectStructure = JSON.parse(data.payload.projectStructure)
                } catch(err) {
                    throw new Error('Remix cannot parse projectStructure to JSON');
                }

                if (data.payload.projectStructure.app.bg) {
                    document.body.style.backgroundColor = data.payload.projectStructure.app.bg;
                }

                Remix.init({
                    container: root,
                    projectStructure: data.payload.projectStructure
                });

                sendMessage('initialized', {
                    clientId,
                    sizes: {
                        maxWidth: data.payload.projectStructure.app.maxWidth ? data.payload.projectStructure.app.maxWidth : 800,
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
                    window.addEventListener(evt, throttle(() => sendMessage('user-activity'), 5000))
                })
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
    let s = '',
        r = crypto.getRandomValues(new Uint8Array(t))
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

(function(rl) {
    let data = null, cnt = null;

    function init({
        container,
        projectStructure
    }) {
        cnt = container
        setData(projectStructure)
    }

    function setData(d) {
        data = data || {}
        let dd = {}
        if (typeof d === 'string') {
            d = RL.Methods.htmlDecode(d)
            try {
                dd = JSON.parse(d)
            } catch(err) {
                console.error(err)
            }
        } else if (typeof d === 'object') {
            RL.Methods.forAllStringProperties(d, RL.Methods.htmlDecode)
            dd = d
        }
        if (dd && dd.hasOwnProperty('blocks')) {
            data.blocks = dd.blocks
        }
        if (dd && dd.hasOwnProperty('app')) {
            data.app = dd.app
        }
        render()
    }

    function render() {
        if (cnt) {
            cnt.innerHTML = ''
            if (data && data.blocks) {
                // клонировать данные так как возможно изменение их в ходе рендера и это не должно влиять на исходные данные приложения
                const cd = JSON.parse(JSON.stringify(data))
                cd.blocks.forEach(bdata => {
                    const block = rl.Blocks[bdata.t];
                    if (block) {
                        const b = new block(cnt)
                        b.render(bdata)
                        if (b.postRender) b.postRender()
                    } else {
                        console.error('Block type not supported', bdata.t)
                    }
                });
            }
        }
    }

    // public API
    rl.init = init
})(RL)

/**
 * Methods
 */
RL.Methods = {
    add: (cnt, html, btype, cls, props = null) => {
        const div = document.createElement('div')

        if (btype) {
            div.classList = 'block __' + btype
        }
        if (cls) {
            div.classList += cls
        }

        if (props && props.styles) {
            for (const [key, value] of Object.entries(props.styles)) {
                div.style[key] = value;
            }
        }

        div.innerHTML = html
        cnt.appendChild(div)
        return div
    },
    parse: (template, data) => {
        let s = template;
        for (const key in data) {
            const re = new RegExp(`{{${key}}}`, 'g')
            s = s.replace(re, data[key]);
        }
        return s
    },
    useFont: (text) => {
        RL.Fonts.list.forEach((f, i) => {
            if (text.includes(`ql-font-${f.replace(/ /g, '')}`)) {
                RL.Methods.addFont(f)
            }
        })
    },
    addFont(family) {
        if (!RL.Fonts.imported[family]) {
            const link = document.createElement('link')
            link.href = `https://fonts.googleapis.com/css?family=${family}`
            link.rel = 'stylesheet'
            document.getElementsByTagName('head')[0].append(link)
            RL.Fonts.imported[family] = true
        }
    },
    htmlDecode(str) {
        const chars = [`\n`,`\r`,`\``,`'`,`"`,`<`,`>`]
        chars.forEach(char => {
            const reg = new RegExp(`U\\+${char.charCodeAt(0)};`, 'g')
            str = str.replace(reg, char)
        })
        return str
    },
    forAllStringProperties(obj, fn) {
        if (obj) {
            Object.keys(obj).forEach(k => {
                if (typeof obj[k] === 'string') {
                    obj[k] = fn(obj[k])
                }
                else if (typeof obj[k] === 'object') {
                    RL.Methods.forAllStringProperties(obj[k], fn)
                }
            })
        }
    },
    extend(o, p) {
        for (const k in p) {
            if (p.hasOwnProperty(k)) o[k] = p[k]
        }
        return o
    }
}

/**
 * Fonts
 */
RL.Fonts = {
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

/**
 * UI helpers
 */
RL.UI = {
    modal: () => uiModal({
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse
        },
        ui: {
            button: RL.UI.button
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

/**
 * Blocks
 */
RL.Blocks = {
    // Text
    [BLOCK.text]: cnt => blockText(cnt, {
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse,
            useFont: RL.Methods.useFont
        }
    }),
    // Image
    [BLOCK.image]: cnt => blockImage(cnt, {
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse
        }
    }),
    // Embed Interacty project
    [BLOCK.embedInteractyProject]: cnt => blockEmbedInteractyProject(cnt, {
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse
        }
    }),
    // Flip card
    [BLOCK.flipCards]: cnt => blockFlipCard(cnt, {
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse
        }
    }),
    // Embed Youtube video
    [BLOCK.youtubeVideo]: cnt => blockEmbedYoutubeVideo(cnt, {
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse
        }
    }),
    // CTA button
    [BLOCK.button]: cnt => blockCtaButton(cnt, {
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse
        },
        ui: {
            button: RL.UI.button
        }
    }),
    // Zoom map
    [BLOCK.interactiveImage]: cnt => blockZoomMap(cnt, {
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse,
            extend: RL.Methods.extend
        },
        ui: {
            modal: RL.UI.modal,
            pins: RL.UI.pins,
        }
    }),
    //  Find object
    [BLOCK.hiddenObjects]: cnt => blockFindObject(cnt, {
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse,
            extend: RL.Methods.extend
        },
        ui: {
            modal: RL.UI.modal,
            pins: RL.UI.pins,
        }
    }),
    //  Trivia quiz
    [BLOCK.quiz]: cnt => blockTriviaQuiz(cnt, {
        M: Mustache,
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse,
        },
        sendMessage
    }),
}
