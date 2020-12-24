import isJSON from 'validator/lib/isJSON'
import isURL from "validator/lib/isURL"
import isInt from "validator/lib/isInt"

import isValue from 'type/value/is'
import isArray from 'type/array/is'
import isFunction from 'type/function/is'

// import { getRandomId } from './_utils'

if (window.R === undefined) {
    window.R = {}
    ;(function (global) {
        const classes = 'r_app'
        const initializedAttrName = 'data-initialized'

        // const gaTrackerName = 'interactyTracker'
        // const statCategory = 'InteractyLoader'
        // const analytics = new Analytics()
        // const userActivity = new UserActivity()
        // const userData = new UserData()
        // function createSession(projectId, clientKey) {
        //     setClientKey(clientKey)
        //     sessionInitialize({ projectId })
        // }

        async function init() {
            const elements = document.getElementsByClassName(classes)
            for (const element of elements) {
                const initialized = element.getAttribute(initializedAttrName)
                if (!initialized) {
                    element.setAttribute(initializedAttrName, 'true')
                    const contentUrl = element.getAttribute('data-content')
                    const initialWidth = element.getAttribute('data-initialWidth')
                    const initialHeight = element.getAttribute('data-initialHeight')

                    // sendStatToGA(gaTrackerName, {category: statCategory, action: 'content_requested'})

                    let content;
                    try {
                        const response = await fetch(contentUrl)
                        content = await response.json()
                    } catch (err) {
                        throw new Error(`Cannot get content from ${contentUrl}`)
                    }
                    
                    console.log('content:', content);

                    const htmlFile = content.files.find(el => el.mediaType === 'text/html')
                    if (!htmlFile) {
                        throw new Error(`Cannot get HTML file from ${contentUrl}`)
                    }
                    const cssFile = content.files.find(el => el.mediaType === 'text/css')
                    if (!cssFile) {
                        throw new Error(`Cannot get CSS file from ${contentUrl}`)
                    }
                    const jsFile = content.files.find(el => el.mediaType === 'text/javascript')
                    if (!jsFile) {
                        throw new Error(`Cannot get JS file from ${contentUrl}`)
                    }

                    new window.RC({
                        mode: 'published',
                        nodeElement: element,
                        htmlUrl: htmlFile.url,
                        cssUrl: cssFile.url,
                        jsUrl: jsFile.url,
                        initialWidth,
                        initialHeight,
                        features: content.features,
                        projectStructure: null,
                        onEvent: (name, data) => {
                            console.log('--- onEvent (loader) ---');
                            console.log('method:', data.method);
                            console.log('data:', data);
                            
                            // Sessions + activity
        
                            // data => data.method === 'user-activity' && userActivity.makeActivity(),
                            // data => data.method.indexOf('analytics') !== -1 && analytics.trigger(data),
                            // if (data.method === 'user-data') {userData.push(data)}
                        },
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
        }

        // public
        global.init = init
    })(window.R)
}
window.R.init()

/**
 * _RC
 */
window.RC = class RC {
    constructor({mode, nodeElement, htmlUrl, jsUrl, cssUrl, features, projectStructure, initialWidth, initialHeight, lng, onEvent}) {
        this.mode = this.validateConstructorParam('mode', mode, true)
        this.nodeElement = this.validateConstructorParam('nodeElement', nodeElement, true)
        this.htmlUrl = this.validateConstructorParam('htmlUrl', htmlUrl, false)
        this.jsUrl = this.validateConstructorParam('jsUrl', jsUrl, true)
        this.cssUrl = this.validateConstructorParam('cssUrl', cssUrl, true)
        this.features = this.validateConstructorParam('features', features, true)
        this.projectStructure = this.validateConstructorParam('projectStructure', projectStructure, false, null)
        this.initialWidth = this.validateConstructorParam('initialWidth', initialWidth, false, 800)
        this.initialHeight = this.validateConstructorParam('initialHeight', initialHeight, false, 600)
        this.lng = this.validateConstructorParam('lng', lng, false, 'en')
        this.onEvent = this.validateConstructorParam('onEvent', onEvent, true)

        this.appOrigin = new URL(htmlUrl).origin;
        this.preloader = this.createPreloader()
        this.iframe = null
    }

    validateConstructorParam = ((key, value, required = true, defaultValue) => {
        try {
            const check = (key, value) => {
                switch (key) {
                    case 'mode': {
                        if (typeof value === 'string') {
                            const available = ['preview', 'published']
                            if (available.indexOf(value) !== -1) {
                                return value
                            }
                            return this.throwExceptionManually('cv', { type: 'value', key, value, expected: available })
                        }
                        return this.throwExceptionManually('cv', { type: 'format', key, value, expected: 'String' })
                    }
                    case 'nodeElement': {
                        if (value instanceof Element || value instanceof HTMLDocument) {
                            return value
                        }
                        return this.throwExceptionManually('cv', { type: 'format', key, value, expected: 'HTMLElement' })
                    }
                    case 'htmlUrl':
                    case 'jsUrl':
                    case 'cssUrl': {
                        if (isURL(value)) {
                            return value
                        }
                        return this.throwExceptionManually('cv', { type: 'format', key, value, expected: 'URL' })
                    }
                    case 'features': {
                        if (isArray(value)) {
                            return value
                        }
                        return this.throwExceptionManually('cv', { type: 'format', key, value, expected: 'Array' })
                    }
                    case 'projectStructure': {
                        if (isJSON(value)) {
                            return value
                        }
                        return this.throwExceptionManually('cv', { type: 'format', key, value, expected: 'JSON' })
                    }
                    case 'initialWidth':
                    case 'initialHeight': {
                        if (isInt(value.toString())) {
                            return parseInt(value)
                        }
                        return this.throwExceptionManually('cv', { type: 'format', key, value, expected: 'Number (INT)' })
                    }
                    case 'lng': {
                        if (typeof value === 'string') {
                            const available = ['ru', 'en']
                            if (available.indexOf(value) !== -1) {
                                return value
                            }
                            return this.throwExceptionManually('cv', { type: 'value', key, value, expected: available })
                        }
                        return this.throwExceptionManually('cv', { type: 'format', key, value, expected: 'String' })
                    }
                    case 'onEvent': {
                        if (isFunction(value)) {
                            return value
                        }
                        return this.throwExceptionManually('cv', { type: 'format', key, value, expected: 'Function' })
                    }
                    default:
                        return this.throwExceptionManually('cv', { type: 'unknown', key })
                }
            }

            // check value
            if (isValue(value)) {
                return check(key, value)
            }
            // value required and not defined - throw error
            if (required) {
                return this.throwExceptionManually('cv', { type: 'undefined', key, value })
            }
            // return defaultValue
            return defaultValue
        } catch (err) {
            return this.throwExceptionManually('cv', { type: 'internal', key, err })
        }
    })

    // Create iframe for container instance
    createIframe = () => {
        this.nodeElement.innerHTML = ''
        this.nodeElement.className = 'remix_cnt'
        this.nodeElement.style.position = 'relative'
        this.nodeElement.style.margin = '0 auto'
        this.nodeElement.style.overflow = 'hidden'

        // initial sizes, changes after "initialized" message
        this.nodeElement.style.width = `${this.initialWidth}px`
        this.nodeElement.style.height = `${this.initialHeight}px`

        window.addEventListener('message', this.receiveMessage, false)

        this.nodeElement.appendChild(this.preloader.render())
        if (this.mode === 'published' && !this.features.includes('NO_LOGO')) {
            this.nodeElement.appendChild(this.createPoweredLabel())
        }

        const iframe = document.createElement('iframe')
        iframe.id = 'remix-iframe'
        iframe.setAttribute('allowFullScreen', '')
        iframe.style.border = 0
        iframe.style.width = '100%'
        iframe.style.height = '100%'
        iframe.style.overflow = 'hidden'
        const self = this
        iframe.onload = evt => {
            self.parentNode = this.nodeElement
            self.iframe = iframe
            self.iframe.contentWindow.postMessage(
                {
                    method: 'embed',
                    script: this.jsUrl,
                    css: this.cssUrl
                },
                self.appOrigin,
            )
        }
        iframe.src = this.htmlUrl
        this.nodeElement.appendChild(iframe)
        this.iframe = iframe
    }

    // Set nodeElement size
    setSize = ({ width, height, maxWidth }) => {
        if (isValue(width) && width === 'maxWidth') {
            this.nodeElement.style.width = '100%'
        }
        if (isValue(maxWidth) && isInt(maxWidth.toString())) {
            this.nodeElement.style.maxWidth = maxWidth + 'px'
            this.maxWidth = maxWidth
        }
        if (isValue(maxWidth) && isInt(maxWidth.toString())) {
            this.nodeElement.style.height = height + 'px'
            this.height = height
        }
    }

    createPreloader = () => {
        const MIN_ANIMATION_DELAY = 1000
        const ANIMATION_DURATION = 500

        const html = `
        <div
            data-remix-preloader
            style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; background-color: #fff; transition: opacity ${ANIMATION_DURATION}ms; opacity: 1;"
        >
            <img src="https://interacty.me/static/media/preloader.gif?v=${Math.random()}" alt="preloader" style="display: block; width: 100%; max-width: 380px; margin: 130px auto 0;" />
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
    createPoweredLabel = () => {
        const html = `
            <a href="${process.env.REACT_APP_STATIC_URL}" target="_blank">
                <img src="https://interacty.me/static/media/powered_by.svg" style="position: absolute; bottom: 0; right: 0;" alt="powered by interacty" />
            </a>
        `

        const div = document.createElement('div');
        div.innerHTML = html.trim();
        return div.firstChild;
    }

    // Receive message from remix app
    receiveMessage = ({ origin = null, data = {}, source = null }) => {
        if (!this.iframe || this.iframe.contentWindow !== source || origin !== this.appOrigin) {
            return
        }

        console.log('--- receiveMessage (loader) ---');
        console.log('method:', data.method);
        console.log('data:', data);

        switch (data.method) {
            case 'embedded': {
                // this.sendEventToContainerInstance(data.method, data)
                this.iframe.contentWindow.postMessage({
                    method: 'init',
                    mode: this.mode,
                    projectStructure: this.projectStructure
                }, this.appOrigin)
                break;
            }
            case 'initialized': {
                this.preloader.hideAndDestroy()
                this.setSize({ ...data.sizes, width: 'maxWidth'})
                break;
            }
            case 'setSize': {
                this.setSize(data.sizes)
                break;
            }
            default:
                break;
        }
    }

    // Send event to container instance
    sendEventToContainerInstance = (name, data) => {
        if (this.onEvent) {
            this.onEvent(name, data)
        }
    }

    throwExceptionManually = (initiator, data) => {
        switch (initiator) {
            case 'cv': {
                switch (data.type) {
                    case 'undefined': {
                        throw new Error(`[CONSTRUCTOR VALIDATOR] Field "${data.key}" is required. Received value: "${data.value}"`)
                    }
                    case 'unknown': {
                        throw new Error(`[CONSTRUCTOR VALIDATOR] Unknown field: "${data.key}"`)
                    }
                    case 'format': {
                        throw new Error(`[CONSTRUCTOR VALIDATOR] Invalid field "${data.key}" format! Expected type: "${data.expected}". Received type: "${typeof data.value}", value: "${data.value}"`)
                    }
                    case 'value': {
                        throw new Error(`[CONSTRUCTOR VALIDATOR] Invalid field "${data.key}" value! Expected values: "${data.expected.join(', ')}". Received value: "${data.value}"`)
                    }
                    case 'internal': {
                        console.error(data.err);
                        throw new Error(`[CONSTRUCTOR VALIDATOR] Internal error! Validating field: "${data.key}". Received value: "${data.value}"`)
                    }
                    default:
                        break;
                }
                break;
            }
            default:
                break;
        }
        throw new Error(`[REMIX CONTAINER] Unhandled exception`)
    }
}