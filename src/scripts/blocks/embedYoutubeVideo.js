// Template
const template = `<div class="vc">{{embedCode}}</div>`

export default function(cnt, { methods }) {
    return {
        render: data => {
            methods.add(cnt, methods.parse(template, data), data.t)
        }
    }
}