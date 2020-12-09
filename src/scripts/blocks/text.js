// Template
const template = `<p>{{text}}</p>`

export default function(cnt, { methods }) {
    return {
        render: data => {
            const styles = {
                backgroundColor: data.wrapperStyle__bg
            }

            methods.add(cnt, methods.parse(template, data), data.t, null, styles)
            methods.useFont(data.text)
        }
    }
}

