// Template
const template = `<p>Trivia structure: <span>{{structure}}</span></p>`

export default function(cnt, { methods }) {
    return {
        render: data => {
            methods.add(cnt, methods.parse(template, data), data.t)
        }
    }
}

