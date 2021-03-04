import {DEFAULT_IMAGE_BG_WIDE_URL} from "../utils/constants";

export default function (cnt, {methods, ui}) {
    let d, dt, pins;
    const modal = ui.modal();

    return {
        render: data => {
            dt = data
            pins = data.pins
            data.rpins = ''
            for (let i = 0; i < data.pins.length && i < data.count; i++) {
                data.rpins += methods.parse(ui.pins.item, methods.extend(data.pins[i], {
                    psize: data.psize,
                    tr: data.psize / 2,
                    pcl: data.pcl,
                    ind: i,
                    pimg: data.pimg,
                    cl: 'int' + (data.pimg ? ' im' : '')
                }))
            }
            d = methods.add(cnt, methods.parse(ui.pins.wrapper, {
                ...data,
                bimg: data.bimg ? data.bimg : DEFAULT_IMAGE_BG_WIDE_URL
            }), data.t)
        },
        postRender: () => {
            if (d) {
                const p = d.querySelectorAll('.z_pin')
                for (let i = 0; i < p.length; i++) {
                    p[i].addEventListener('click', function (e) {
                        const i = e.target.getAttribute('datai'), pin = pins[i]
                        if (pin.h || pin.d || pin.i) {
                            modal.variant_1(d, pin.h, pin.d, pin.i, pin.btext, pin.blink, dt.pcl, dt.btcolor)
                        }
                    })
                }
            }
        }
    }
}
