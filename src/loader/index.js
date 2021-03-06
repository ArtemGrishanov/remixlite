import smoothScroll from 'smoothscroll-polyfill'

import session from './session'
import { validator, throttle } from './utils'
import { CDN_URL, MAX_REFRESH_SESSION_AWAITING, SEND_READ_PERCENT_INTERVAL } from './constants'
import API from "./api";

import googleAnalytics from './integrations/googleAnalytics'

smoothScroll.polyfill()

/**
 * RemixLoader
 */
window.RemixLoader = class RemixLoader {
    #mode
    #nodeElement
    #remixUrl
    #features
    #projectId
    #projectStructure
    #initialWidth
    #initialHeight
    #lng
    #additionalTopOffset
    #onEvent

    #appOrigin
    #preloader
    #error
    #iframe
    #eventListeners = [
        // Example
        // {
        //     target: 'window',
        //     type: 'click',
        //     func: () => {}
        //     capture: false
        // }
    ]

    #_integrations = {}

    #_isDestroyed = false
    #_clientId
    #_session = {
        instance: null,
        data: {
            clientId: null,
            projectId: null,
            utmCampaign: null,
            utmSource: null,
            utmMedium: null,
            utmContent: null,
            referenceTail: null,
            sourceReference: null
        },
        createdAt: null,
        updatedAt: null,
        maxRefreshAwaiting: MAX_REFRESH_SESSION_AWAITING
    }
    #_readPercent = {
        value: 0,
        sentValue: null,
        inProgress: false,
        sendInterval: SEND_READ_PERCENT_INTERVAL
    }

    constructor({mode, nodeElement, remixUrl, features, projectId, projectStructure, initialWidth, initialHeight, lng, additionalTopOffset, onEvent}) {
        this.#mode = this.#validateConstructorParam('mode', mode, false, 'published')
        this.#nodeElement = this.#validateConstructorParam('nodeElement', nodeElement, true)
        this.#remixUrl = this.#validateConstructorParam('remixUrl', remixUrl, true)
        this.#features = this.#validateConstructorParam('features', features, false, [])
        this.#projectId = this.#validateConstructorParam('projectId', projectId, false, null)
        this.#projectStructure = this.#validateConstructorParam('projectStructure', projectStructure, false, null)
        this.#initialWidth = this.#validateConstructorParam('initialWidth', initialWidth, false, 800)
        this.#initialHeight = this.#validateConstructorParam('initialHeight', initialHeight, false, 600)
        this.#lng = this.#validateConstructorParam('lng', lng, false, this.#getWindowLanguage())
        this.#additionalTopOffset = this.#validateConstructorParam('additionalTopOffset', additionalTopOffset, false, 0)
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
            if (validator.isValue(value)) {
                switch (key) {
                    case 'mode': {
                        if (typeof value === 'string') {
                            return value
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
                        if (validator.isURL(value)) {
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
                    case 'projectId': {
                        if (typeof value === 'string') {
                            return value
                        }
                        return this.#throwExceptionManually('CV', { type: 'format', key, value, expected: 'String' })
                    }
                    case 'projectStructure': {
                        if (validator.isJsonString(value)) {
                            return JSON.parse(value)
                        }
                        return this.#throwExceptionManually('CV', { type: 'format', key, value, expected: 'String (JSON)' })
                    }
                    case 'initialWidth':
                    case 'initialHeight':
                    case 'additionalTopOffset': {
                        if (validator.isNumber(value)) {
                            return value
                        }
                        return this.#throwExceptionManually('CV', { type: 'format', key, value, expected: 'Number' })
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

    // Create iframe in container instance
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

        this.#nodeElement.appendChild(this.#preloader.render())
        if (this.#mode === 'published' && !this.#features.includes('NO_LOGO')) {
            this.#nodeElement.appendChild(this.#createPoweredLabel())
        }

        this.#addEventListener(window, 'message', this.#iframeMessageHandler, false)

        const iframe = document.createElement('iframe')
        iframe.id = 'remix-iframe'
        iframe.style.border = 0
        iframe.style.width = '100%'
        iframe.style.height = '100%'
        iframe.style.overflow = 'hidden'
        iframe.setAttribute('allowFullScreen', '')
        iframe.onload = () => {
            iframe.contentWindow.postMessage({
                method: 'init',
                payload: {
                    projectStructure: this.#projectStructure,
                    lng: this.#lng,
                    mode: this.#mode
                }
            }, this.#appOrigin)
        }
        iframe.src = this.#remixUrl
        this.#nodeElement.appendChild(iframe)
        this.#iframe = iframe
    }

    // Destroy iframe (for example we need to remove all event listeners)
    destroyIframe = () => {
        this.#_isDestroyed = true
        this.#removeAllEventListeners()
    }

    #iframeMessageHandler = async ({ origin = null, data = {}, source = null }) => {
        if (!this.#iframe || this.#iframe.contentWindow !== source || origin !== this.#appOrigin) {
            return
        }

        switch (data.method) {
            case 'initError': {
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

                if (!this.#projectStructure) {
                    this.#projectStructure = data.payload.projectStructure
                }

                this.#_clientId = data.payload.clientId

                this.#getIframePosition(true)
                this.#addEventListener(window, 'scroll', throttle(() => this.#getIframePosition(true), 50), false)

                this.#getWindowSize(true)
                this.#addEventListener(window, 'resize', throttle(() => this.#getWindowSize(true), 50), false)

                if (this.#needToDo('create-session')) {
                    const queryString = window.location.search;
                    const urlParams = new URLSearchParams(queryString);

                    const utmCampaign = urlParams.get('utm_campaign')
                    const utmSource = urlParams.get('utm_source')
                    const utmMedium = urlParams.get('utm_medium')
                    const utmContent = urlParams.get('utm_content')
                    const referenceTail = queryString
                    const sourceReference = document.referrer

                    this.#_session.data = {
                        ...this.#_session.data,
                        clientId: this.#_clientId,
                        projectId: this.#projectId,
                        utmCampaign,
                        utmSource,
                        utmMedium,
                        utmContent,
                        referenceTail,
                        sourceReference
                    }
                    this.#_session.instance = new session(this.#_session.data)
                    await this.#_session.instance.sendActivity()
                    const time = Date.now()
                    this.#_session.createdAt = time
                    this.#_session.updatedAt = time
                }

                if (this.#needToDo('read-percent')) {
                    this.#checkReadPercent()
                    this.#addEventListener(window, 'scroll', throttle(() => this.#checkReadPercent(), 500), false)
                    this.#sendReadPercentByInterval()
                }

                if (this.#needToDo('create-integrations')) {
                    const integrations = this.#projectStructure.integrations
                    if (integrations) {
                        if (integrations.googleAnalytics && integrations.googleAnalytics.id) {
                            this.#_integrations.googleAnalytics = new googleAnalytics({
                                id: integrations.googleAnalytics.id
                            })
                            this.#_integrations.googleAnalytics.init()
                        }
                    }
                }
                break;
            }
            case 'activity': {
                if (this.#needToDo('refresh-session')) {
                    const time = Date.now()
                    if (time - this.#_session.updatedAt > this.#_session.maxRefreshAwaiting) {
                        this.#_session.instance = new session(this.#_session.data)
                        this.#_session.createdAt = time
                        this.#_session.updatedAt = time
                    } else {
                        await this.#_session.instance.sendActivity()
                        this.#_session.updatedAt = time
                    }
                }
                break;
            }
            case 'setSize': {
                this.#setSize(data.payload.sizes)
                break;
            }
            case 'scrollParent': {
                if (validator.isValue(data.payload.top) && validator.isNumber(data.payload.top)) {
                    window.scrollTo({
                        top: this.#getIframePosition().top + pageYOffset + data.payload.top - this.#additionalTopOffset,
                        behavior: "smooth"
                    });
                }
                break;
            }
            default:
                break;
        }

        this.#sendEventToContainerInstance(data.method, data)
    }

    // Change top offset
    changeAdditionalTopOffset = value => {
        if (validator.isNumber(value)) {
            this.#additionalTopOffset = value
        }
    }

    #addEventListener = (target, type, func, capture = false) => {
        try {
            this.#eventListeners.push({
                target,
                type,
                func,
                capture
            })
            target.addEventListener([type], func, capture)
        } catch (err) {
            console.error(err);
        }
    }
    #removeAllEventListeners = () => {
        try {
            this.#eventListeners.forEach(el => {
                el.target.removeEventListener([el.type], el.func, el.capture)
            })
            this.#eventListeners = []
        } catch (err) {
            console.error(err);
        }
    }

    // Get language from window.navigator
    #getWindowLanguage = () => {
        try {
            const language = window.navigator ? (
                window.navigator.language ||
                window.navigator.systemLanguage ||
                window.navigator.userLanguage
            ) : null;
            return language ? language.slice(0, 2).toLowerCase() : null
        } catch (err) {
            return null
        }
    }

    // Set nodeElement size
    #setSize = ({ width, height, maxWidth }) => {
        try {
            if (validator.isValue(width) && width === 'maxWidth') {
                this.#nodeElement.style.width = '100%'
            }
            if (validator.isValue(maxWidth) && validator.isNumber(maxWidth)) {
                this.#nodeElement.style.maxWidth = `${maxWidth}px`
            }
            if (validator.isValue(height) && validator.isNumber(height)) {
                this.#nodeElement.style.height = `${height}px`
            }
        } catch (err) {
            console.error(err);
        }
    }

    #createPreloader = () => {
        const html = `
        <div style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; background-color: #fff; opacity: 1; display: flex; align-items: center; justify-content: center;">
            <img src='${CDN_URL}/preloader.gif' alt="preloader" style="width: 100%; max-width: 380px;" />
        </div>`

        const div = document.createElement('div');
        div.innerHTML = html.trim();
        const element = div.firstChild;

        return {
            render: () => {
                return element
            },
            hideAndDestroy: () => {
                const container = element.parentNode
                if (container && container.contains(element)) {
                    container.removeChild(element)
                }
            }
        }
    }
    #createPoweredLabel = () => {
        const html = `<a href="https://interacty.me" target="_blank"><img src='${CDN_URL}/powered_by.svg' style="position: absolute; bottom: 0; right: 0;" alt="Powered by Interacty" /></a>`

        const div = document.createElement('div');
        div.innerHTML = html.trim();
        // div.firstChild.addEventListener('click', () => {})
        return div.firstChild;
    }
    #createError = () => {
        const html = `
        <div style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; background-color: #fff; display: flex; align-items: center; justify-content: center;"
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

    #getIframePosition = forceSendToIframe => {
        const rect = this.#iframe.getBoundingClientRect()
        const position = {
            top: rect.top,
            left: rect.left
        };

        if (forceSendToIframe) {
            this.#iframe.contentWindow.postMessage({
                method: 'iframePosition',
                payload: {
                    data: {
                        ...position,
                        top: position.top - this.#additionalTopOffset,
                        windowBottom: position.top - window.innerHeight,
                    }
                }
            }, this.#appOrigin)
        }
        return position
    }

    #getWindowSize = forceSendToIframe => {
        const sizes = {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight
        };

        if (forceSendToIframe) {
            this.#iframe.contentWindow.postMessage({
                method: 'windowSize',
                payload: {
                    data: sizes
                }
            }, this.#appOrigin)
        }
        return sizes
    }

    #checkReadPercent = async () => {
        if (this.#_readPercent.value < 100) {
            const rect = this.#iframe.getBoundingClientRect()

            const marginOfError = 0

            const percentOfRead = (((rect.bottom - marginOfError) - window.innerHeight) / rect.height) * 100

            const value = Math.round(100 - percentOfRead)
            if (value > this.#_readPercent.value) {
                this.#_readPercent.value = value > 100 ? 100 : value
            }
        }
    }

    #sendReadPercentByInterval = async () => {
        const sendData = async () => {
            await API.sendProjectReadPercent({
                clientId: this.#_clientId,
                projectId: this.#projectId,
                value: this.#_readPercent.value
            })
            this.#_readPercent.sentValue = this.#_readPercent.value
        }

        try {
            await sendData()
        } catch (err) {
            console.error(err)
        }

        const intervalChecker = setInterval(async () => {
            if (this.#_isDestroyed || this.#_readPercent.sentValue === 100) {
                clearInterval(intervalChecker)
                return
            }

            try {
                if (!this.#_readPercent.inProgress) {
                    this.#_readPercent.inProgress = true
                    if (!this.#_readPercent.sentValue || (this.#_readPercent.sentValue < this.#_readPercent.value)) {
                        await sendData()
                    }
                    this.#_readPercent.inProgress = false
                }
            } catch (err) {
                console.error(err)
                this.#_readPercent.inProgress = false
            }
        }, this.#_readPercent.sendInterval);
    }

    // Send event to container instance
    #sendEventToContainerInstance = (name, data) => {
        if (this.#onEvent) {
            this.#onEvent(name, data)
        }
    }

    #needToDo = action => {
        switch (action) {
            case 'create-session':
            case 'refresh-session': {
                return this.#mode === 'published' && this.#projectId
            }
            case 'create-integrations': {
                return this.#mode === 'published'
            }
            case 'read-percent': {
                return this.#mode === 'published' && this.#projectId
            }
            default:
                return false
        }
    }

    #throwExceptionManually = (initiator, data) => {
        let errorMessage = '[RemixLoader] Unhandled exception';

        switch (initiator) {
            case 'CV': {
                const errorPrefix = '[RemixLoader | CONSTRUCTOR VALIDATOR]'
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
 * RemixLoader auto-initiator (for embedded projects)
 */
(async () => {
    if (window.RemixLoader) {
        const classes = 'remix-app'
        const initializedAttrName = 'initialized'

        const elements = document.getElementsByClassName(classes)
        for (const element of elements) {
            const initialized = element.getAttribute(initializedAttrName)
            if (!initialized) {
                element.setAttribute(initializedAttrName, 'true')
                const hash = element.getAttribute('hash')
                const initialWidth = element.getAttribute('initialWidth')
                const initialHeight = element.getAttribute('initialHeight')
                const lng = element.getAttribute('lng')

                if (!hash) {
                    console.error(`[RemixLoader auto-initiator] "hash" attribute is required for remix-app element`);
                    return
                }

                let mode = 'published'
                let features = null
                let projectId = null

                try {
                    const meta = await API.getProjectMetaInfo(hash)

                    features = meta.features
                    projectId = meta.projectId
                } catch (err) {
                    mode = 'emergency'
                    console.warn(`[RemixLoader auto-initiator] Cannot get project meta information from server. Emergency mode activated`);
                }

                new window.RemixLoader({
                    mode,
                    nodeElement: element,
                    remixUrl: `${CDN_URL}/${hash}/index.html`,
                    features,
                    projectId,
                    initialWidth,
                    initialHeight,
                    lng: lng || null
                }).createIframe()
            }
        }
    }
})()
