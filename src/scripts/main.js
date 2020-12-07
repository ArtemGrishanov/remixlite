const RL = window.RemixLite || {};
window.RemixLite = RL;

// import { f } from './testModule'

(function(rl) {
    // f('hello world')

    var data = null,
        cnt = null,
        nor

    function init({
        container,
        noRender,
        defaultProperties,
        origin,
        source
    }) {
        cnt = container
        nor = noRender
        setData(defaultProperties)
    }

    function setData(d) {
        data = data || {}
        var dd = {}
        if (typeof d === 'string') {
            d = RL.U.htmlDecode(d)
            try {
                dd = JSON.parse(d)
            }
            catch(err) {
                console.error(err)
            }
        }
        else if (typeof d === 'object') {
            RL.U.forAllStringProperties(d, RL.U.htmlDecode)
            dd = d
        }
        // установить только те данные, которые поддеержвает приложение. В обычном ремикс приложении приходит гораздо больше данных
        if (dd && dd.hasOwnProperty('blocks')) {
            data.blocks = dd.blocks
        }
        if (dd && dd.hasOwnProperty('app')) {
            data.app = dd.app
        }
        if (!data.share) {
            if (!data.app) data.app = {};
            data.app.share = { previewHtml:RL.U.defPreview(), entities:[] };
        }
        if (!nor) {
            render()
        }
    }

    function getData() {
        return data
    }

    function serialize() {
        return JSON.stringify(data)
    }

    function render() {
        if (cnt) {
            cnt.innerHTML = ''
            if (data && data.blocks) {
                // клонировать данные так как возможно изменение их в ходе рендера и это не должно влиять на исходные данные приложения
                var cd = JSON.parse(JSON.stringify(data))
                cd.blocks.forEach(bdata => {
                    const block = rl.Blocks['B' + bdata.t];
                    if (block) {
                        var b = new block(cnt)
                        b.render(bdata)
                        if (b.postRender) b.postRender()
                    }
                    else {
                        console.error('Block type not supported', bdata.t)
                    }
                });
            }
        }
    }

    // public API
    rl.init = init
    rl.setData = setData
    rl.getData = getData
    rl.serialize = serialize
})(RL)

RL.Blocks = {}
RL.T = {}

RL.U = {
    add: (cnt, html, btype, cls) => {
        const div = document.createElement('div')
        if (btype) {
            div.classList = 'block __' + btype
        }
        if (cls) {
            div.classList += cls
        }
        div.innerHTML = html
        cnt.appendChild(div)
        return div
    },
    parse: (templ, data) => {
        let s = templ;
        for (const key in data) {
            const re = new RegExp(`{{${key}}}`, 'g')
            s = s.replace(re, data[key]);
        }
        return s
    },
    useFont: (text) => {
        RL.U.Fonts.forEach((f, i) => {
            if (text.includes(`ql-font-${f.replace(/ /g, '')}`)) {
                RL.U.addFont(f)
            }
        })
    },
    addFont(family) {
        if (!RL.U.importedFonts[family]) {
            const link = document.createElement('link')
            link.href = `https://fonts.googleapis.com/css?family=${family}`
            link.rel = 'stylesheet'
            document.getElementsByTagName('head')[0].append(link)
            RL.U.importedFonts[family] = true
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
                    RL.U.forAllStringProperties(obj[k], fn)
                }
            })
        }
    },
    defPreview() {
        return '<div style="width:1200px;height:630px;background-image:url(//p.testix.me/images/common/sh.jpg);background-size:cover;background-position:center"></div>'
    },
    extend(o, p) {
        for (var k in p) {
            if (p.hasOwnProperty(k)) o[k] = p[k]
        }
        return o
    }
}

RL.U.Fonts = [
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
];
RL.U.importedFonts = {
    // 'Ubuntu': true | false
    // ...
};

/**
 * Text
 */
RL.Blocks.B1 = function(cnt) {

    const tt = `<p>{{text}}</p>`

    this.render = function(data) {
        RL.U.add(cnt, RL.U.parse(tt, data), data.t)
        RL.U.useFont(data.text)
    }
}

/**
 * Image
 */
RL.Blocks.B2 = function(cnt) {
    const
            bc = '__blur',
            cr = `<div class="cur">
                    <svg viewBox="0 0 94.2691 104.3058" width="100%" height="100%">
                    <path fillRule="evenodd" clipRule="evenodd" fill="#FFFFFF" d="M27.7876,72.8258C15.1172,67.6919,6.1761,55.276,6.1761,40.7637 c0-19.1026,15.4857-34.5882,34.5882-34.5882s34.5882,15.4856,34.5882,34.5882c0,1.0043-0.0519,1.9975-0.1359,2.9795 c-0.5868,0.0828-1.1674,0.2075-1.7282,0.4138l-0.3434,0.1272c-0.5176,0.1915-1.0092,0.4299-1.47,0.7103 c-0.0939-0.0939-0.1952-0.1766-0.2915-0.2656c0.168-1.2995,0.2631-2.6213,0.2631-3.9653c0-17.0285-13.8538-30.8824-30.8824-30.8824 S9.882,23.7352,9.882,40.7637c0,12.5308,7.5056,23.3335,18.2527,28.1709c-0.2471,0.5979-0.4361,1.2217-0.4978,1.8838 C27.5726,71.504,27.6455,72.1735,27.7876,72.8258z M40.7643,18.5284c-12.2801,0-22.2353,9.9552-22.2353,22.2353 c0,12.2591,9.9207,22.197,22.1723,22.2316l-1.4169-3.7763c-9.5266-0.7585-17.0495-8.7372-17.0495-18.4553 c0-10.2171,8.3123-18.5294,18.5294-18.5294s18.5294,8.3123,18.5294,18.5294c0,1.8258-0.2755,3.5873-0.7696,5.2562 c0.0581,0.0124,0.1198,0.0173,0.1791,0.0309c0.9536-1.3069,2.2717-2.3075,3.8294-2.8819l0.3385-0.1248 c0.0049-0.0025,0.0087-0.0025,0.0136-0.0037c0.0753-0.7486,0.1149-1.5083,0.1149-2.2766 C62.9996,28.4837,53.0456,18.5284,40.7643,18.5284z M86.5814,66.0551c4.6077,12.2875-1.7368,25.9708-14.1738,30.5636 c-9.3116,3.4391-19.3978,0.8066-25.8127-5.8924l-0.0037-0.0037c-0.7029-0.735-1.3564-1.5231-1.9654-2.352L31.9715,73.2359 c-1.0105-1.2069-0.8363-2.9993,0.3879-4.0036c3.5836-2.9338,8.8867-2.4459,11.8428,1.0908l5.8121,6.951L37.0239,42.6377 c-0.882-2.3495,0.3323-4.9671,2.7102-5.8442l0.3409-0.126c2.3779-0.8783,5.0215,0.3138,5.9022,2.6633l6.1752,16.4652 c-0.8808-2.3483,0.3323-4.9659,2.7115-5.8442l0.3397-0.126c2.3779-0.8783,5.0215,0.315,5.9022,2.6645 c-0.8808-2.3495,0.3323-4.9671,2.7102-5.8454l0.3409-0.126c2.3779-0.8783,5.0215,0.315,5.9022,2.6645l1.659,4.4224 c-0.882-2.3495,0.3323-4.9671,2.7102-5.8454l0.3409-0.1248c2.3779-0.8795,5.0202,0.3138,5.9022,2.6633L86.5814,66.0551z"></path>
                    </svg>
                  </div>`
    let d, icnt, tt;

    this.render = function(data) {
        //if (data.blur) {
            tt = `<div class="icnt ${data.blur ? '__blur': ''}"><img src="{{url}}">${data.blur ? cr: ''}</div>`
            // data.cl = bc
            // b = data.blur
            // tt += cr
        //}
        d = RL.U.add(cnt, RL.U.parse(tt, data), data.t)
        if (data.blur) {
            icnt = d.querySelector('.'+bc)
        }
    }

    this.postRender = function() {
        if (icnt) d.addEventListener('click', () => icnt.classList.toggle(bc))
    }
}

/**
 * Interacty project
 */
RL.Blocks.B3 = function(cnt) {
    const tt =
        `<div>
            {{embedCode}}
        </div>`

    this.render = function(data) {
        RL.U.add(cnt, RL.U.parse(tt, data), data.t)
        var script  = document.createElement("script");
        script.src = "//interacty.me/legacy/editor_assets/js/l.js"
        cnt.appendChild(script);
    }
}

/**
 * Flip card
 */
RL.Blocks.B4 = function(cnt) {
    const tt =
        `<div class="flip_inner" style="height:{{height}}px">
            <div class="flip_side" style="background-color:{{frontColor}};background-image:url({{frontSrc}})" >
                <div class="text-area-cnt">
                    <div class="text-area">
                        <p>{{frontText}}</p>
                    </div>
                </div>
                <div class="hint">
                    <p>
                        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M34.3542 19.362C33.8923 19.8446 33.8923 20.627 34.3542 21.1096C34.8807 21.6596 35.6342 22.5 35.6342 24.0976C35.6342 24.5171 35.4425 25.1726 34.8758 25.9821C34.3206 26.7754 33.4577 27.6383 32.2694 28.451C29.9319 30.0497 26.4047 31.4053 21.7409 31.6577L23.5584 29.9623C24.0457 29.5078 24.088 28.7266 23.6529 28.2175C23.2178 27.7084 22.47 27.6641 21.9827 28.1187L17.8427 31.9805C17.5913 32.215 17.4476 32.5503 17.4476 32.9024C17.4476 33.2544 17.5913 33.5897 17.8427 33.8242L21.9827 37.686C22.47 38.1406 23.2178 38.0964 23.6529 37.5873C24.088 37.0781 24.0457 36.2969 23.5584 35.8424L21.7259 34.133C26.8254 33.8802 30.8143 32.4004 33.5652 30.5188C34.946 29.5744 36.033 28.516 36.7854 27.4411C37.5264 26.3825 38 25.2229 38 24.0976C38 21.4936 36.6835 20.0477 36.0271 19.362C35.5651 18.8793 34.8162 18.8793 34.3542 19.362ZM3.76598 19.509C4.15022 20.061 4.03341 20.8339 3.50507 21.2353C3.22959 21.4446 2.36576 22.4405 2.36576 24.0977C2.36576 25.1591 2.88518 26.5872 4.78033 27.9697C6.70403 29.3731 10.0021 30.6846 15.3724 31.367C16.0209 31.4494 16.4827 32.0654 16.4038 32.743C16.3249 33.4205 15.7353 33.9029 15.0868 33.8205C9.51545 33.1126 5.79013 31.7209 3.4259 29.9962C1.0331 28.2506 0 26.1258 0 24.0977C0 21.5532 1.30479 19.851 2.1136 19.2364C2.64194 18.835 3.38173 18.9571 3.76598 19.509Z" fill="white"/>
                        <path d="M30.0833 22.8703V5.62959C30.0833 4.27496 28.975 3.16663 27.6203 3.16663H10.3796C9.02496 3.16663 7.91663 4.27496 7.91663 5.62959V22.8703C7.91663 24.225 9.02496 25.3333 10.3796 25.3333H27.6203C28.975 25.3333 30.0833 24.225 30.0833 22.8703ZM14.6898 16.0972L17.7685 19.8039L22.0787 14.25L27.6203 21.6388H10.3796L14.6898 16.0972Z" fill="white"/>
                        </svg>
                    </p>
                    &nbsp
                    <p>Click to flip</p>
                </div>
            </div>
            <div class="flip_side __back" style="background-color:{{backColor}};background-image:url({{backSrc}})">
                <div class="text-area-cnt">
                    <div class="text-area">
                        <p>{{backText}}</p>
                    </div>
                </div>
            </div>
        </div>`

    let fi = null

    this.render = function(data) {
        const div = RL.U.add(cnt, RL.U.parse(tt, data), data.t)
        fi = div.querySelector('.flip_inner')
    }

    this.postRender = function() {
        fi.addEventListener('click', () => fi.classList.toggle('__flipped'))
    }
}

/**
 * Youtube video
 */
RL.Blocks.B5 = function(cnt) {
    const tt =
        `<div class="vc">{{embedCode}}</div>`

    this.render = function(data) {
        RL.U.add(cnt, RL.U.parse(tt, data), data.t)
    }
}

/**
 * CTA button
 */
RL.T.T6 = `<a href="{{href}}" target="_blank" class="btn" style="border-radius:{{brad}}px;background-color:{{bc}};color:{{color}}">
<p>{{text}}</p>
</a>`
RL.Blocks.B6 = function(cnt) {
    this.render = function(data) {
        RL.U.add(cnt, RL.U.parse(RL.T.T6, data), data.t)
    }
}

/**
 * Zoom map
 */
RL.T.T7 = `<div datai={{ind}} class="z_pin {{cl}}" style="width:{{psize}}px;height:{{psize}}px;left:{{l}}%;top:{{t}}%;background-color:{{pcl}};margin:-{{tr}}px -{{tr}}px;background-image:url({{pimg}})"></div>`
RL.T.T71 = `<div class="z_cnt">{{rpins}}<img src="{{bimg}}"></div>`
RL.Blocks.B7 = function(cnt) {
    var d, dt, pins
    this.render = function(data) {
        dt = data
        if (data.bimg) {
            pins = data.pins
            data.rpins = ''
            for (var i=0; i<data.pins.length && i<data.count; i++) {
                data.rpins += RL.U.parse(RL.T.T7, RL.U.extend(data.pins[i], {
                    psize: data.psize,
                    tr: data.psize/2,
                    pcl: data.pcl,
                    ind: i,
                    pimg: data.pimg,
                    cl: data.pimg ? 'im': ''
                }))
            }
            d = RL.U.add(cnt, RL.U.parse(RL.T.T71, data), data.t)
        }
    }

    this.postRender = function() {
        if (d) {
            var p = d.querySelectorAll('.z_pin')
            for (var i=0; i<p.length; i++) {
                p[i].addEventListener('click', function(e) {
                    var i = e.target.getAttribute('datai'), pin = pins[i]
                    if (pin.h || pin.d || pin.i) {
                        RL.H.showModal(d, pin.h, pin.d, pin.i, pin.btext, pin.blink, dt.pcl, dt.btcolor)
                    }
                })
            }
        }
    }
}

/**
 * Find object
 */
RL.Blocks.B8 = function(cnt) {
    var d, dt, pins, self = this, oc = 0, fs;

    this.render = function(data) {
        if (data.bimg) {
            dt = data
            pins = data.pins
            data.rpins = ''
            for (var i=0; i<data.pins.length && i<data.count; i++) {
                data.rpins += RL.U.parse(RL.T.T7, RL.U.extend(data.pins[i], {
                    psize: data.psize,
                    tr: data.psize/2,
                    pcl: data.pcl,
                    ind: i,
                    pimg: data.pimg,
                    cl: 'hid' + (data.pimg ? ' im': '')
                }))
            }
            d = RL.U.add(cnt, RL.U.parse(RL.T.T71, data), data.t)
        }
    }

    this.postRender = function() {
        if (d) {
            var p = d.querySelectorAll('.z_pin')
            for (var i=0; i<p.length; i++) {
                p[i].addEventListener('click', function(e) {
                    var i = e.target.getAttribute('datai'), pin = pins[i]
                    if (e.target.classList.contains('hid')) {
                        oc++
                        e.target.classList.toggle('hid')
                        e.target.classList.add('rev')
                        setTimeout(function() {
                            if (pin.h || pin.d || pin.i) {
                                RL.H.showModal(d, pin.h, pin.d, pin.i, pin.btext, pin.blink, dt.pcl, dt.btcolor, function() {
                                    self.showFinal()
                                })
                            }
                            else self.showFinal()
                        }, 1200)
                    }
                    else {
                        RL.H.showModal(d, pin.h, pin.d, pin.i, pin.btext, pin.blink, dt.pcl, dt.btcolor, function() {
                            self.showFinal()
                        })
                    }
                })
            }
        }
    }

    this.showFinal = function() {
        if (!fs && oc === dt.count && (dt.suct || dt.sucd)) {
            RL.H.showModal(d, dt.suct, dt.sucd, undefined, dt.sucBtext, dt.sucBlink, dt.pcl, dt.btcolor)
            fs = true
        }
    }
}

/**
 * UI Helpers
 */
RL.H = {}

/**
 *
 * @param {*} cnt dom element to add
 * @param {*} h header
 * @param {*} d description
 * @param {*} i image
 * @param {*} bt button text
 * @param {*} bl buton link
 * @param {*} bc button color
 * @param {*} btc button text color
 * @param {*} onClose on close callback
 */
RL.H.showModal = function(cnt,h,d,i,bt,bl,bc,btc,onClose) {
    if (h || d || i) {
        var tm, ntc = '', o = { h:h, d:d, i:i, cl:'', href:bl, bc:bc, text:bt, color:btc, brad:4}
        if (h || d) {
            tm = `<div class="msg">` +
                (h ? `<h2>{{h}}</h2>`: ``) +
                (d ? `<p>{{d}}</p>`: ``) +
                (bt ? RL.T.T6: ``) +
                `</div>`
        }
        else {
            o.cl = 'no_text'
            ntc = bt ? RL.T.T6: ``
        }
        var t = `<div class="mo">` +
                (o.i ? (`<div class="msgi {{cl}}" style="background-image:url({{i}})">`+ntc+`</div>`): ``) +
                (tm ? tm: '') +
                `</div>`
        var d = RL.U.add(cnt, RL.U.parse(t, o), null, 'mow')
        if (!bl) {
            // если ссылка на кнопке не задана, то поведение по умолчанию - закрыть модалку
            var b = d.querySelector('.btn')
            if (b) {
                b.addEventListener('click', function(e) {
                    d.remove()
                    e.stopPropagation()
                    e.preventDefault()
                    if (onClose) onClose()
                })
            }
        }
        d.addEventListener('click', function() {
            // закрытие по клику на затемненный фон
            d.remove()
            if (onClose) onClose()
        })
        d.querySelector('.mo').addEventListener('click', function(e) {
            e.stopPropagation()
        })
        return d
    }
}