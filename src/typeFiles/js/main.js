import Mustache from 'mustache'

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

const RL = window.RemixLite || {};
window.RemixLite = RL;

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
                    const block = rl.Blocks['B' + bdata.t];
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
    add: (cnt, html, btype, cls, styles = {}) => {
        const div = document.createElement('div')

        if (btype) {
            div.classList = 'block __' + btype
        }
        if (cls) {
            div.classList += cls
        }
        for (const [key, value] of Object.entries(styles)) {
            div.style[key] = value;
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
    B1: cnt => blockText(cnt, {
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse,
            useFont: RL.Methods.useFont
        }
    }),
    // Image
    B2: cnt => blockImage(cnt, {
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse
        }
    }),
    // Embed Interacty project
    B3: cnt => blockEmbedInteractyProject(cnt, {
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse
        }
    }),
    // Flip card
    B4: cnt => blockFlipCard(cnt, {
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse
        }
    }),
    // Embed Youtube video
    B5: cnt => blockEmbedYoutubeVideo(cnt, {
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse
        }
    }),
    // CTA button
    B6: cnt => blockCtaButton(cnt, {
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse
        },
        ui: {
            button: RL.UI.button
        }
    }),
    // Zoom map
    B7: cnt => blockZoomMap(cnt, {
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
    B8: cnt => blockFindObject(cnt, {
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
    B9: cnt => blockTriviaQuiz(cnt, {
        M: Mustache,
        methods: {
            add: RL.Methods.add,
            parse: RL.Methods.parse,
        },
    })
}