export default function(cnt, { methods, ui }) {
    return {
        render: data => {
            methods.add(cnt, methods.parse(ui.button.colored, data), data.t)
        }
    }
}