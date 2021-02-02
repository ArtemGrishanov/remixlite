// Template
const template = `<div>{{embedCode}}</div>`

export default function(cnt, { methods }) {
    return {
        render: data => {
            methods.add(cnt, methods.parse(template, data), data.t)
            let src = "//interacty.me/legacy/editor_assets/js/l.js";
            const { embedCode } = data;
            const scrIndex = embedCode.indexOf('<script')
            const srcStartIndex = embedCode.indexOf('src="', scrIndex + 1)
            const srcEndIndex = embedCode.indexOf('.js"', srcStartIndex + 1);
            if (~scrIndex && ~srcStartIndex && ~srcEndIndex) {
                src = embedCode.slice(srcStartIndex+5, srcEndIndex+3);
            }
            const script  = document.createElement("script");
            script.src = src;
            cnt.appendChild(script);
        }
    }
}
