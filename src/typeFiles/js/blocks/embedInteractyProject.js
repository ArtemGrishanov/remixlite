// Template
const template = `<div>{{embedCode}}</div>`

export default function(cnt, { methods }) {
    return {
        render: data => {
            methods.add(cnt, methods.parse(template, data), data.t)
            let src = "//interacty.me/legacy/editor_assets/js/l.js";
            try {
                const { embedCode } = data;
                src = /<script.*?src=['"](.*?)['"]/.exec(embedCode)[1];
            } catch (err) {
                console.error(`[RemixLite | Block type: 10 (ThenNow), ID: ${data.id}]`, err);
            }
            const script  = document.createElement("script");
            script.src = src;
            cnt.appendChild(script);
        }
    }
}
