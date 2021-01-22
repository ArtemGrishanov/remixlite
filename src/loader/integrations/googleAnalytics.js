export default class GoogleAnalytics {
    #id

    constructor({id}) {
        this.#id = id
    }

    // Public methods
    init = () => {
        try {
            const scriptElement = document.createElement('script')
            scriptElement.src = `https://www.googletagmanager.com/gtag/js?id=${this.#id}`
            scriptElement.async = false
            scriptElement.defer = true
            document.body.appendChild(scriptElement)

            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', this.#id);
        } catch (err) {
            console.error(err)
        }
    }
}