export default function(cnt, { methods, ui }) {
    let d, dt, pins;

    return {
        render: data => {
            dt = data
            if (data.bimg) {
                pins = data.pins
                data.rpins = ''
                for (let i = 0; i < data.pins.length && i < data.count; i++) {
                    // if (data.pins[i].h.length) {
                        data.rpins += methods.parse(ui.pins.item, methods.extend(data.pins[i], {
                            psize: data.psize,
                            tr: data.psize/2,
                            pcl: data.pcl,
                            ind: i,
                            pimg: data.pimg,
                            cl: data.pimg ? 'im': ''
                        }))
                    // }
                }
                d = methods.add(cnt, methods.parse(ui.pins.wrapper, data), data.t)
            }
        },
        postRender: () => {
            if (d) {
                const p = d.querySelectorAll('.z_pin')
                for (let i = 0; i < p.length; i++) {
                    p[i].addEventListener('click', function(e) {
                        const i = e.target.getAttribute('datai'), pin = pins[i]
                        if (pin.h || pin.d || pin.i) {
                            ui.modal().variant_1(d, pin.h, pin.d, pin.i, pin.btext, pin.blink, dt.pcl, dt.btcolor)
                        }
                    })
                }
            }
        }
    }
}