// Template
const template = `<p>mark-{{timeMark}}-</p><p>{{text}}</p>`

export default function(cnt, { methods }) {
    return {
        render: data => {
            const wrapperProps = {
                styles: {
                    backgroundColor: data.wP_bg
                }
            }

            methods.add(cnt, methods.parse(template, data), data.t, null, wrapperProps)
            methods.useFont(data.text)
        }
    }
}

