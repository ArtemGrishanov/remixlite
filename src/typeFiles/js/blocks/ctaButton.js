export default function(cnt, { methods, ui }) {
    return {
        render: data => {
            const cls = data && data.pulse ? 'pulse' : '';
            methods.add(cnt, methods.parse(ui.button.colored, {...data, cls}), data.t)
        }
    }
}
