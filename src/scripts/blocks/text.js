// Template
const template = `<p>{{text}}</p>`

export default function(cnt, { methods }) {
    return {
        render: data => {
            methods.add(cnt, methods.parse(template, data), data.t)
            methods.useFont(data.text)
        }
    }
}

