import smoothScroll from 'smoothscroll-polyfill'

smoothScroll.polyfill()

const UTILS = {
    validator: {
        isValue: value => {
            try {
                return value !== void 0 && value !== null
            } catch (err) {
                return false
            }
        },
        isJSON: value => {
            try {
                return (JSON.parse(value) && !!value);
            } catch (e) {
                return false;
            }
        },
        isURL: value => {
            try {
                const regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
                return regexp.test(value)
            } catch (err) {
                return false;
            }
        },
        isInt: value => {
            try {
                const regexp = /^[-+]?[0-9]+$/
                return regexp.test(value)
            } catch (err) {
                return false
            }
        }
    }
}


/**
 * "R Class"
 */
window.RC = class RC {
    #mode
    #nodeElement
    #remixUrl
    #features
    #projectStructure
    #initialWidth
    #initialHeight
    #lng
    #topOffset
    #onEvent

    #appOrigin
    #preloader
    #error
    #iframe

    constructor({mode, nodeElement, remixUrl, features, projectStructure, initialWidth, initialHeight, lng, topOffset, onEvent}) {
        this.#mode = this.#validateConstructorParam('mode', mode, false, 'published')
        this.#nodeElement = this.#validateConstructorParam('nodeElement', nodeElement, true)
        this.#remixUrl = this.#validateConstructorParam('remixUrl', remixUrl, true)
        this.#features = this.#validateConstructorParam('features', features, false, [])
        this.#projectStructure = this.#validateConstructorParam('projectStructure', projectStructure, false, null)
        this.#initialWidth = this.#validateConstructorParam('initialWidth', initialWidth, false, 800)
        this.#initialHeight = this.#validateConstructorParam('initialHeight', initialHeight, false, 600)
        this.#lng = this.#validateConstructorParam('lng', lng, false, this.#getLanguage())
        this.#topOffset = this.#validateConstructorParam('topOffset', topOffset, false, 0)
        this.#onEvent = this.#validateConstructorParam('onEvent', onEvent, false, null)

        this.#appOrigin = new URL(remixUrl).origin;
        this.#preloader = this.#createPreloader()
        this.#error = this.#createError()
        this.#iframe = null
    }

    // [PRIVATE]
    #validateConstructorParam = ((key, value, required = true, defaultValue) => {
        try {
            // check value and return (formatted or error)
            if (UTILS.validator.isValue(value)) {
                switch (key) {
                    case 'mode': {
                        if (typeof value === 'string') {
                            const available = ['dev', 'preview', 'published']
                            if (available.indexOf(value) !== -1) {
                                return value
                            }
                            return this.#throwExceptionManually('CV', { type: 'value', key, value, expected: available })
                        }
                        return this.#throwExceptionManually('CV', { type: 'format', key, value, expected: 'String' })
                    }
                    case 'nodeElement': {
                        if (value instanceof Element || value instanceof HTMLDocument) {
                            return value
                        }
                        return this.#throwExceptionManually('CV', { type: 'format', key, value, expected: 'HTMLElement' })
                    }
                    case 'remixUrl': {
                        if (UTILS.validator.isURL(value)) {
                            return value
                        }
                        return this.#throwExceptionManually('CV', { type: 'format', key, value, expected: 'String (URL)' })
                    }
                    case 'features': {
                        if (Array.isArray(value)) {
                            return value
                        }
                        return this.#throwExceptionManually('CV', { type: 'format', key, value, expected: 'Array' })
                    }
                    case 'projectStructure': {
                        if (UTILS.validator.isJSON(value)) {
                            return value
                        }
                        return this.#throwExceptionManually('CV', { type: 'format', key, value, expected: 'String (JSON)' })
                    }
                    case 'initialWidth':
                    case 'initialHeight':
                    case 'topOffset': {
                        if (UTILS.validator.isInt(value)) {
                            return parseInt(value)
                        }
                        return this.#throwExceptionManually('CV', { type: 'format', key, value, expected: 'Number/String (INT)' })
                    }
                    case 'lng': {
                        if (typeof value === 'string') {
                            return value
                        }
                        return this.#throwExceptionManually('CV', { type: 'format', key, value, expected: 'String' })
                    }
                    case 'onEvent': {
                        if (typeof value === 'function') {
                            return value
                        }
                        return this.#throwExceptionManually('CV', { type: 'format', key, value, expected: 'Function' })
                    }
                    default:
                        return this.#throwExceptionManually('CV', { type: 'unknown', key })
                }
            }
            // value required and not defined - throw error
            if (required) {
                return this.#throwExceptionManually('CV', { type: 'undefined', key, value })
            }
            // return default value
            return defaultValue
        } catch (err) {
            if (err.name === 'ManuallyException') {
                throw err;
            } else {
                return this.#throwExceptionManually('CV', { type: 'internal', key, err })
            }
        }
    })

    // [PUBLIC] Create iframe for container instance
    createIframe = () => {
        this.#nodeElement.innerHTML = ''
        this.#nodeElement.className = 'remix_cnt'
        this.#nodeElement.style.position = 'relative'
        this.#nodeElement.style.margin = '0 auto'
        this.#nodeElement.style.overflow = 'hidden'

        // initial sizes, changes after "initialized" message
        this.#nodeElement.style.maxWidth = `100%`
        this.#nodeElement.style.width = `${this.#initialWidth}px`
        this.#nodeElement.style.height = `${this.#initialHeight}px`

        window.addEventListener('message', this.receiveMessage, false)

        this.#nodeElement.appendChild(this.#preloader.render())
        if (this.#mode === 'published' && !this.#features.includes('NO_LOGO')) {
            this.#nodeElement.appendChild(this.#createPoweredLabel())
        }

        const iframe = document.createElement('iframe')
        iframe.id = 'remix-iframe'
        iframe.style.border = 0
        iframe.style.width = '100%'
        iframe.style.height = '100%'
        iframe.style.overflow = 'hidden'
        iframe.setAttribute('allowFullScreen', '')
        iframe.onload = evt => {
            iframe.contentWindow.postMessage({
                method: 'init',
                payload: {
                    mode: this.#mode,
                    projectStructure: this.#projectStructure
                }
            }, this.#appOrigin)
        }
        iframe.src = this.#remixUrl
        this.#nodeElement.appendChild(iframe)
        this.#iframe = iframe
    }

    // [PRIVATE] Get language form window.navigator
    #getLanguage = () => {
        const language = window.navigator ? (
            window.navigator.language ||
            window.navigator.systemLanguage ||
            window.navigator.userLanguage
        ) : null;
        return language ? language.slice(0, 2).toLowerCase() : null
    }

    // [PRIVATE] Set nodeElement size
    #setSize = ({ width, height, maxWidth }) => {
        if (UTILS.validator.isValue(width) && width === 'maxWidth') {
            this.#nodeElement.style.width = '100%'
        }
        if (UTILS.validator.isValue(maxWidth) && UTILS.validator.isInt(maxWidth)) {
            this.#nodeElement.style.maxWidth = maxWidth + 'px'
        }
        if (UTILS.validator.isValue(height) && UTILS.validator.isInt(height)) {
            this.#nodeElement.style.height = height + 'px'
        }
    }

    // [PRIVATE]
    #createPreloader = () => {
        const MIN_ANIMATION_DELAY = 0
        const ANIMATION_DURATION = 500

        const html = `
        <div
            data-remix-preloader
            style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; background-color: #fff; transition: opacity ${ANIMATION_DURATION}ms; opacity: 1; display: flex; align-items: center; justify-content: center;"
        >
            <img src="https://interacty.me/static/media/preloader.gif?v=${Math.random()}" alt="preloader" style="width: 100%; max-width: 380px;" />
         </div>`

        const div = document.createElement('div');
        div.innerHTML = html.trim();
        const element = div.firstChild;


        let animationStart = 0
        let animationEnd = 0

        return {
            render: function () {
                animationStart = Date.now()
                return element
            },
            hideAndDestroy: function () {
                animationEnd = Date.now()
                const diff = animationEnd - animationStart
                const animationDelay = diff > MIN_ANIMATION_DELAY ? 0 : MIN_ANIMATION_DELAY - diff

                window.setTimeout(() => {
                    element.style.opacity = 0
                    window.setTimeout(() => {
                        const container = element.parentNode
                        if (container && container.contains(element)) {
                            container.removeChild(element)
                        }
                    }, ANIMATION_DURATION)
                }, animationDelay)
            },
        }
    }
    // [PRIVATE]
    #createPoweredLabel = () => {
        const html = `
            <a href="https://google.com" target="_blank">
                <img src="https://interacty.me/static/media/powered_by.svg" style="position: absolute; bottom: 0; right: 0;" alt="Powered by Interacty" />
            </a>
        `

        const div = document.createElement('div');
        div.innerHTML = html.trim();
        div.firstChild.addEventListener('click', evt => this.#sendEventToContainerInstance('createPoweredLabel clicked', null))
        return div.firstChild;
    }
    // [PRIVATE]
    #createError = () => {
        const html = `
        <div
            data-remix-preloader
            style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; background-color: #fff; display: flex; align-items: center; justify-content: center;"
        >
            <span style="font-size: 16px;">Oops! Some error occurred &#128532;</span>
         </div>`

        const div = document.createElement('div');
        div.innerHTML = html.trim();
        const element = div.firstChild;

        return {
            render: function () {
                return element
            }
        }
    }

    // [PRIVATE] Receive message from remix app
    receiveMessage = ({ origin = null, data = {}, source = null }) => {
        if (!this.#iframe || this.#iframe.contentWindow !== source || origin !== this.#appOrigin) {
            return
        }

        switch (data.method) {
            case 'init_error': {
                this.#preloader.hideAndDestroy()
                this.#nodeElement.appendChild(this.#error.render())
                break;
            }
            case 'initialized': {
                this.#preloader.hideAndDestroy()
                this.#setSize({
                    ...data.payload.sizes,
                    width: 'maxWidth'
                })
                break;
            }
            case 'setSize': {
                this.#setSize(data.payload.sizes)
                break;
            }
            case 'scrollParent': {
                window.scrollTo({
                    top: this.#getElementCoords(this.#iframe).top + data.payload.top - this.#topOffset,
                    behavior: "smooth"
                });
                break;
            }
            default:
                break;
        }

        this.#sendEventToContainerInstance(data.method, data)
    }

    // [PRIVATE] Send event to container instance
    #sendEventToContainerInstance = (name, data) => {
        if (this.#onEvent) {
            this.#onEvent(name, data)
        }
    }

    // [PRIVATE] Get element coords
    #getElementCoords = el => {
        const box = el.getBoundingClientRect();
        return {
            top: box.top + pageYOffset,
            left: box.left + pageXOffset
        };
    }

    // [PRIVATE]
    #throwExceptionManually = (initiator, data) => {
        let errorMessage = '[REMIX CONTAINER] Unhandled exception';

        switch (initiator) {
            case 'CV': {
                const errorPrefix = '[CONSTRUCTOR VALIDATOR]'
                switch (data.type) {
                    case 'undefined': {
                        errorMessage = `${errorPrefix} Field "${data.key}" is required. Received value: "${data.value}"`
                        break;
                    }
                    case 'unknown': {
                        errorMessage = `${errorPrefix} Unknown field: "${data.key}"`
                        break;
                    }
                    case 'format': {
                        errorMessage = `${errorPrefix} Invalid field "${data.key}" format! Expected type: "${data.expected}". Received type: "${typeof data.value}", value: "${data.value}"`
                        break;
                    }
                    case 'value': {
                        errorMessage = `${errorPrefix} Invalid field "${data.key}" value! Expected values: "${data.expected.join(', ')}". Received value: "${data.value}"`
                        break;
                    }
                    case 'internal': {
                        errorMessage = `${errorPrefix} Internal error! Validating field: "${data.key}". Received value: "${data.value}"`
                        break;
                    }
                    default:
                        break;
                }
                break;
            }
            default:
                break;
        }

        const error = new Error(errorMessage)
        error.name = 'ManuallyException'
        throw error
    }
};

/**
 * "R Class" BOOTLOADER (For embedded projects)
 */
(async () => {
    if (window.RC) {
        const classes = 'rmx_interacty'
        const initializedAttrName = 'data-initialized'

        const elements = document.getElementsByClassName(classes)
        for (const element of elements) {
            const initialized = element.getAttribute(initializedAttrName)
            if (!initialized) {
                element.setAttribute(initializedAttrName, 'true')
                const contentUrl = element.getAttribute('data-content')
                const initialWidth = element.getAttribute('data-initialWidth')
                const initialHeight = element.getAttribute('data-initialHeight')
                const projectStructure = element.getAttribute('data-project-structure')
                const remixUrl = element.getAttribute('data-remix-url')
                const mode = element.getAttribute('data-mode')
                const lng = element.getAttribute('data-lng')

                // sendStatToGA(gaTrackerName, {category: statCategory, action: 'content_requested'})

                let htmlFile, features;
                if (remixUrl) {
                    features = []
                } else {
                    let content;
                    try {
                        const response = await fetch(contentUrl)
                        content = await response.json()
                    } catch (err) {
                        throw new Error(`Cannot get content from ${contentUrl}`)
                    }

                    features = content.features
                    htmlFile = content.files.find(el => el.mediaType === 'text/html')
                    if (!htmlFile) {
                        throw new Error(`Cannot get HTML file from ${contentUrl}`)
                    }
                }

                new window.RC({
                    mode: mode ? mode : 'published',
                    nodeElement: element,
                    remixUrl: remixUrl ? remixUrl : htmlFile.url,
                    features,
                    projectStructure: projectStructure ? projectStructure : null,
                    initialWidth,
                    initialHeight,
                    lng: lng ? lng : null,
                    onEvent: (name, data) => {}
                    // onEvent: (name, data) => {
                    //     console.log('--- onEvent (BOOTLOADER) ---');
                    //     console.log('method:', data.method);
                    //     console.log('data:', data);
                    //
                    //     switch (data.method) {
                    //         case 'initialized': {
                    //             // createSession(content.projectId, data.payload.clientId)
                    //             break;
                    //         }
                    //         default:
                    //             break;
                    //     }
                    //
                    //     // Sessions + activity
                    //
                    //     // data => data.method === 'user-activity' && userActivity.makeActivity(),
                    //     // data => data.method.indexOf('analytics') !== -1 && analytics.trigger(data),
                    //     // if (data.method === 'user-data') {userData.push(data)}
                    // },
                }).createIframe()

                // sendStatToGA(gaTrackerName, {category: statCategory, action: 'container_created'})

                // analytics.setConversionActionIds(
                //     Object.fromEntries(
                //         (json.projectActions || []).map(({ actionType, id }) => [actionType, id]),
                //     ),
                // )
                // userData.formTemplate = json.projectForms
            }
        }

        // const gaTrackerName = 'interactyTracker'
        // const statCategory = 'InteractyLoader'
        // const analytics = new Analytics()
        // const userActivity = new UserActivity()
        // const userData = new UserData()
        // function createSession(projectId, clientKey) {
        //     // setClientKey(clientKey)
        //     // sessionInitialize({ projectId })
        // }
    }
})()