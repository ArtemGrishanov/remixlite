// Template
const template = `<div>{{embedCode}}</div>`

export default function(cnt, { methods }) {
    return {
        render: data => {
            methods.add(cnt, methods.parse(template, data), data.t)
            const script  = document.createElement("script");
            script.src = "//interacty.me/legacy/editor_assets/js/l.js"
            cnt.appendChild(script);
        }
    }
}