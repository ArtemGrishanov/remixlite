export default function({ methods, ui }) {
    return {
        variant_1: (cnt, h, d, i, bt, bl, bc, btc, onClose) => {
            if (h || d || i) {
                let tm, ntc = '', o = { h: h, d: d, i: i, cl: '', href: bl, bc: bc, text: bt, color: btc, brad: 4}
                if (h || d) {
                    tm = `<div class="msg">` +
                        (h ? `<h2>{{h}}</h2>` : ``) +
                        (d ? `<p>{{d}}</p>` : ``) +
                        (bt ? ui.button.colored : ``) +
                        `</div>`
                } else {
                    o.cl = 'no_text'
                    ntc = bt ? ui.button.colored : ``
                }
                let t = `<div class="mo">` +
                    (o.i ? (`<div class="msgi {{cl}}" style="background-image:url({{i}})">`+ntc+`</div>`): ``) +
                    (tm ? tm: '') +
                    `</div>`
                d = methods.add(cnt, methods.parse(t, o), null, 'mow')
                if (!bl) {
                    // если ссылка на кнопке не задана, то поведение по умолчанию - закрыть модалку
                    const b = d.querySelector('.btn')
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
    }
}