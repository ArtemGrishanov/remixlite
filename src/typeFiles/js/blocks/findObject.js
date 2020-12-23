export default function(cnt, { methods, ui }) {
    let d, dt, pins, oc = 0, fs;
    const modal = ui.modal();

    const showFinal = () => {
        if (!fs && oc === dt.count && (dt.suct || dt.sucd)) {
            modal.variant_1(d, dt.suct, dt.sucd, undefined, dt.sucBtext, dt.sucBlink, dt.pcl, dt.btcolor)
            fs = true
        }
    }

    return {
        render: data => {
            if (data.bimg) {
                dt = data
                pins = data.pins
                data.rpins = ''
                for (let i = 0; i < data.pins.length && i < data.count; i++) {
                    data.rpins += methods.parse(ui.pins.item, methods.extend(data.pins[i], {
                        psize: data.psize,
                        tr: data.psize/2,
                        pcl: data.pcl,
                        ind: i,
                        pimg: data.pimg,
                        cl: 'hid' + (data.pimg ? ' im': '')
                    }))
                }
                d = methods.add(cnt, methods.parse(ui.pins.wrapper, data), data.t)
            }
        },
        postRender: () => {
            if (d) {
                const p = d.querySelectorAll('.z_pin')
                for (let i = 0; i<p.length; i++) {
                    p[i].addEventListener('click', function(e) {
                        const i = e.target.getAttribute('datai'), pin = pins[i]
                        if (e.target.classList.contains('hid')) {
                            oc++
                            e.target.classList.toggle('hid')
                            e.target.classList.add('rev')
                            setTimeout(function() {
                                if (pin.h || pin.d || pin.i) {
                                    modal.variant_1(d, pin.h, pin.d, pin.i, pin.btext, pin.blink, dt.pcl, dt.btcolor, () => {
                                        showFinal()
                                    })
                                } else showFinal()
                            }, 1200)
                        } else {
                            modal.variant_1(d, pin.h, pin.d, pin.i, pin.btext, pin.blink, dt.pcl, dt.btcolor, () => {
                                showFinal()
                            })
                        }
                    })
                }
            }
        }
    }
}