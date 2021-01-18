import { sessionInitialize, sessionRefresh, setClientKey, createAction, getRankBattleData } from './api'

import Analytics from './Analytics'
import UserActivity from './UserActivity'
import UserData from './UserData'

import { getProjectFileByType } from './helpers'
import { sendStatToGA } from './utils'

if (window.remix_interacty === undefined) {
    window.remix_interacty = {}
    ;(function (global) {
        /**
         * Все элементы с этим классом будут наализироваться как проекты
         */
        var clazz = 'rmx_interacty'
        /**
         * Локация раcположения всех опубликованных проектов
         * @type {string}
         */
        var publishedProjectsHome = '//p.interacty.me/'
        /**
         * Приложения на странице
         * key - ссылка на контент приложения
         *
         * Example:
         * 'http://52.29.160.34:8888/api/projects/1001/versions/51896/content': {
         *      features:
         *      files:
         *      projectActions:
         *      projectForms:
         *      type:
         *
         * }
         *
         * @type {object}
         */
        var remixApps = {}
        /**
         *
         */
        var initedAttrName = 'data-inited'
        /**
         *
         */
        var gaTrackerName = 'interactyTracker'
        /**
         *
         */
        var gaId = 'UA-88595022-2'
        /**
         *
         */
        var statCategory = 'InteractyLoader'

        const analytics = new Analytics()
        const userActivity = new UserActivity()
        const userData = new UserData()

        function parseProjectId(url) {
            var parts = url.split('/')

            return parts[parts.indexOf('projects') + 1]
        }

        function getProjectData(url, json) {
            var projectId = parseProjectId(url)

            return {
                projectId,
                projectType: {
                    id: json.type.id,
                },
                title: json.type.name,
                description: json.type.description,
            }
        }

        function createSession(projectId, clientKey) {
            setClientKey(clientKey)
            sessionInitialize({ projectId })
        }

        /**
         * Найти и проинициализировать все контейнеры с опубликованными приложениями
         * Подходит для многократного перезапуска
         */
        function init() {
            var elems = document.getElementsByClassName(clazz)
            //TODO embed rcnt dynimically
            //TODO later embed minified rcnt.js script right inside l.js file ?
            for (var i = 0; i < elems.length; i++) {
                var e = elems[i]
                var inited = e.getAttribute(initedAttrName)
                if (!inited) {
                    // init each project once
                    e.setAttribute(initedAttrName, 'true')
                    var cLink = e.getAttribute('data-content')
                    var mw = e.getAttribute('data-mw') || undefined
                    var h = e.getAttribute('data-h') || undefined

                    sendStatToGA(gaTrackerName, {category: statCategory, action: 'content_requested'})
                    requestContent(cLink, function (json) {
                        const rcnt = (json.rcnt = createRemixContainer(
                            e,
                            json.features,
                            // 'http://localhost:8080/',
                            getProjectFileByType(json.files, 'html'),
                            // 'http://localhost:8080/trivia.js',
                            getProjectFileByType(json.files, 'projectjs'),
                            // 'http://localhost:8080/remix.css',
                            getProjectFileByType(json.files, 'css'),
                            // 'http://localhost:8080/remix.js',
                            getProjectFileByType(json.files, 'commonjs'),
                            mw,
                            h,
                            function (name, data) {
                                if (data && data.appId) {
                                    if (json.type.projectType === 'RANK_BATTLE') {
                                        createSession(json.projectId, data.appId)

                                        userActivity.onActivityLongTime = () =>
                                            createSession(json.projectId, data.appId)
                                    } else {
                                        userActivity.onFirstActiviy = userActivity.onActivityLongTime = () =>
                                            createSession(json.projectId, data.appId)
                                    }
                                    userActivity.onActivity = sessionRefresh
                                } else {
                                    console.error('Something is wrong:', data)
                                }
                            },
                        ))

                        if (json.type.projectType === 'RANK_BATTLE') {
                            const updateAnswers = data => res => {
                                for (const { answers } of res.answersAndCounts) {
                                    if (data.numberOfVotes[answers.answerId] < answers.count) {
                                        rcnt.setData(
                                            {
                                                [`router.screens.${data.screenId}.components.${data.componentId}.numberOfVotes.${answers.answerId}`]: answers.count,
                                            },
                                            true,
                                            true,
                                        )
                                    }
                                }
                            }

                            rcnt.addReceiveMessageListener(data => {
                                if (data.method === 'rank-battle') {
                                    let needUpdate = true

                                    for (const id in data.numberOfNewVotes) {
                                        if (data.numberOfNewVotes[id]) {
                                            createAction(
                                                {
                                                    type: 'RANK_BATTLE',
                                                    actionType: 'BUTTON_CLICKED',
                                                    questionId: data.componentId,
                                                    answerId: id,
                                                    count: data.numberOfNewVotes[id],
                                                },
                                                'rank-battle',
                                                needUpdate ? updateAnswers(data) : void 0,
                                            )

                                            needUpdate = false
                                        }
                                    }

                                    if (needUpdate) {
                                        getRankBattleData({
                                            questionId: data.componentId,
                                            projectId: json.projectId,
                                            onFulfilled: res => updateAnswers(data)(JSON.parse(res)),
                                        })
                                    }
                                }
                            })
                        }
                        // type: 'test_question_answered',
                        // actionType: 'test_question_answered',
                        analytics.setConversionActionIds(
                            Object.fromEntries(
                                (json.projectActions || []).map(({ actionType, id }) => [actionType, id]),
                            ),
                        )
                        userData.formTemplate = json.projectForms
                        rcnt.addReceiveMessageListener(
                            data => data.method === 'user-activity' && userActivity.makeActivity(),
                        )
                        rcnt.addReceiveMessageListener(
                            data => data.method.indexOf('analytics') !== -1 && analytics.trigger(data),
                        )
                        rcnt.addReceiveMessageListener(data => {
                            if (data.method === 'user-data') {
                                userData.push(data)
                            }
                        })

                        remixApps[cLink] = json
                        sendStatToGA(gaTrackerName, {category: statCategory, action: 'container_created'})
                    })
                    //TODO initGA(e);
                    //TODO createPoweredLabel
                }
            }
        }

        function showError() {
            //TODO pretty error message
            // regular error
            // blocked
            // deleted
            // tariff expired - ads?
            //
        }

        /**
         * Request project content
         *
         * @param {string} url example, http://52.29.160.34:8888/api/projects/1001/versions/51896/content
         */
        function requestContent(url, clb) {
            var xhr = new XMLHttpRequest()
            xhr.open('GET', url)
            xhr.onload = function () {
                if (xhr.status !== 200) {
                    //TODO error UI
                } else {
                    try {
                        var json = JSON.parse(xhr.responseText)
                        clb(json)
                    } catch (err) {
                        console.error(err.message)
                        showError()
                    }
                }
            }
            xhr.send()
        }

        function getFileUrl(files, mediaType) {
            for (var i = 0; i < files.length; i++) {
                if (files[i].mediaType === mediaType) {
                    return files[i].url
                }
            }
        }

        function createRemixContainer(
            container,
            features,
            htmlUrl,
            scriptUrl,
            cssUrl,
            commonjsUrl,
            minWidth,
            height,
            initedEventHandler,
        ) {
            return new window.RemixContainer({
                mode: 'published',
                width: minWidth,
                height: height,
                url: htmlUrl,
                element: container,
                features,
                scriptUrl: scriptUrl,
                cssUrl: cssUrl,
                commonjsUrl,
                onEvent: function (name, data) {
                    if (name === 'embedded') sendStatToGA(gaTrackerName, {category: statCategory, action: 'app_embedded'})
                    else if (name === 'inited') {
                        sendStatToGA(gaTrackerName, {category: statCategory, action: 'app_inited'})

                        initedEventHandler(name, data)
                    }
                },
            })
        }

        /**
         * Инициализировать Google Analytics api
         * @param cnt куда встроить скрипт ga
         */
        function initGA(cnt) {
            if (!window.ga) {
                var gaCode =
                    "<script>(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');ga('create', '{{ga_id}}', 'auto', {{params}});ga('" +
                    gaTrackerName +
                    ".send', 'pageview');{{init_event}}</script>"
                gaCode = gaCode.replace('{{ga_id}}', gaId)
                gaCode = gaCode.replace('{{params}}', "{'name':'" + gaTrackerName + "'}")
                gaCode = gaCode.replace(
                    '{{init_event}}',
                    "ga('" + gaTrackerName + ".send', 'event', '" + statCategory + "', 'Init_analytics');",
                )
                var d = document.createElement('div')
                d.innerHTML = gaCode
                cnt.appendChild(d.firstChild)
            } else {
                window.ga('create', gaId, 'auto', { name: gaTrackerName })
            }
        }

        /**
         * Вставить метку "TESTIX" со ссылкой на сайт
         *
         * @param cnt контейнер куда вставить
         * @param {string} [labelMod] - возможность установить модификатор для иконки (например, "__small" для панорам)
         */
        function createPoweredLabel(cnt, labelMod) {
            labelMod = labelMod || ''
            var s =
                '<a href="http://testix.me" target="_blank" class="tstx_pwrd ' +
                labelMod +
                '" onclick="testix.onLabelClick()"></a>'
            var div = document.createElement('div')
            div.innerHTML = s
            cnt.appendChild(div.firstChild)
        }

        /**
         * Клик на иконку сервиса в углу проекта.
         * Для сбора статистики
         *
         * @param e
         */
        function onLabelClick(e) {
            sendStatToGA(gaTrackerName, {category: statCategory, action: 'Label_click'})
        }

        // public
        global.init = init
        global.getApps = function () {
            return remixApps
        }
        global.onLabelClick = onLabelClick
    })(window.remix_interacty)
}
// можно запускать несколько раз, например, если появятся новые ембеды
// или же теги встроены непоследовательно
window.remix_interacty.init()
if (window.remix_interacty === undefined) {
    window.remix_interacty = {}
    ;(function (global) {
        /**
         * Все элементы с этим классом будут наализироваться как проекты
         */
        var clazz = 'rmx_interacty'
        /**
         * Локация раcположения всех опубликованных проектов
         * @type {string}
         */
        var publishedProjectsHome = '//p.interacty.me/'
        /**
         * Приложения на странице
         * key - ссылка на контент приложения
         *
         * Example:
         * 'http://52.29.160.34:8888/api/projects/1001/versions/51896/content': {
         *      features:
         *      files:
         *      projectActions:
         *      projectForms:
         *      type:
         *
         * }
         *
         * @type {object}
         */
        var remixApps = {}
        /**
         *
         */
        var initedAttrName = 'data-inited'
        /**
         *
         */
        var gaTrackerName = 'interactyTracker'
        /**
         *
         */
        var gaId = 'UA-88595022-2'
        /**
         *
         */
        var statCategory = 'InteractyLoader'

        const analytics = new Analytics()
        const userActivity = new UserActivity()
        const userData = new UserData()

        function parseProjectId(url) {
            var parts = url.split('/')

            return parts[parts.indexOf('projects') + 1]
        }

        function getProjectData(url, json) {
            var projectId = parseProjectId(url)

            return {
                projectId,
                projectType: {
                    id: json.type.id,
                },
                title: json.type.name,
                description: json.type.description,
            }
        }

        function createSession(projectId, clientKey) {
            setClientKey(clientKey)
            sessionInitialize({ projectId })
        }

        /**
         * Найти и проинициализировать все контейнеры с опубликованными приложениями
         * Подходит для многократного перезапуска
         */
        function init() {
            var elems = document.getElementsByClassName(clazz)
            //TODO embed rcnt dynimically
            //TODO later embed minified rcnt.js script right inside l.js file ?
            for (var i = 0; i < elems.length; i++) {
                var e = elems[i]
                var inited = e.getAttribute(initedAttrName)
                if (!inited) {
                    // init each project once
                    e.setAttribute(initedAttrName, 'true')
                    var cLink = e.getAttribute('data-content')
                    var mw = e.getAttribute('data-mw') || undefined
                    var h = e.getAttribute('data-h') || undefined

                    sendStatToGA(gaTrackerName, {category: statCategory, action: 'content_requested'})
                    requestContent(cLink, function (json) {
                        const rcnt = (json.rcnt = createRemixContainer(
                            e,
                            json.features,
                            // 'http://localhost:8080/',
                            getProjectFileByType(json.files, 'html'),
                            // 'http://localhost:8080/trivia.js',
                            getProjectFileByType(json.files, 'projectjs'),
                            // 'http://localhost:8080/remix.css',
                            getProjectFileByType(json.files, 'css'),
                            // 'http://localhost:8080/remix.js',
                            getProjectFileByType(json.files, 'commonjs'),
                            mw,
                            h,
                            function (name, data) {
                                if (data && data.appId) {
                                    if (json.type.projectType === 'RANK_BATTLE') {
                                        createSession(json.projectId, data.appId)
                                        userActivity.onActivityLongTime = () =>
                                            createSession(json.projectId, data.appId)
                                    } else {
                                        userActivity.onFirstActiviy = userActivity.onActivityLongTime = () =>
                                            createSession(json.projectId, data.appId)
                                    }
                                    userActivity.onActivity = sessionRefresh
                                } else {
                                    console.error('Something is wrong:', data)
                                }
                            },
                        ))

                        if (json.type.projectType === 'RANK_BATTLE') {
                            const updateAnswers = data => res => {
                                for (const { answers } of res.answersAndCounts) {
                                    if (data.numberOfVotes[answers.answerId] < answers.count) {
                                        rcnt.setData(
                                            {
                                                [`router.screens.${data.screenId}.components.${data.componentId}.numberOfVotes.${answers.answerId}`]: answers.count,
                                            },
                                            true,
                                            true,
                                        )
                                    }
                                }
                            }

                            rcnt.addReceiveMessageListener(data => {
                                if (data.method === 'rank-battle') {
                                    let needUpdate = true

                                    for (const id in data.numberOfNewVotes) {
                                        if (data.numberOfNewVotes[id]) {
                                            createAction(
                                                {
                                                    type: 'RANK_BATTLE',
                                                    actionType: 'BUTTON_CLICKED',
                                                    questionId: data.componentId,
                                                    answerId: id,
                                                    count: data.numberOfNewVotes[id],
                                                },
                                                'rank-battle',
                                                needUpdate ? updateAnswers(data) : void 0,
                                            )

                                            needUpdate = false
                                        }
                                    }

                                    if (needUpdate) {
                                        getRankBattleData({
                                            questionId: data.componentId,
                                            projectId: json.projectId,
                                            onFulfilled: res => updateAnswers(data)(JSON.parse(res)),
                                        })
                                    }
                                }
                            })
                        }
                        // type: 'test_question_answered',
                        // actionType: 'test_question_answered',
                        analytics.setConversionActionIds(
                            Object.fromEntries(
                                (json.projectActions || []).map(({ actionType, id }) => [actionType, id]),
                            ),
                        )
                        userData.formTemplate = json.projectForms
                        rcnt.addReceiveMessageListener(
                            data => data.method === 'user-activity' && userActivity.makeActivity(),
                        )
                        rcnt.addReceiveMessageListener(
                            data => data.method.indexOf('analytics') !== -1 && analytics.trigger(data),
                        )
                        rcnt.addReceiveMessageListener(data => {
                            if (data.method === 'user-data') {
                                userData.push(data)
                            }
                        })

                        remixApps[cLink] = json
                        sendStatToGA(gaTrackerName, {category: statCategory, action: 'container_created'})
                    })
                    //TODO initGA(e);
                    //TODO createPoweredLabel
                }
            }
        }

        function showError() {
            //TODO pretty error message
            // regular error
            // blocked
            // deleted
            // tariff expired - ads?
            //
        }

        /**
         * Request project content
         *
         * @param {string} url example, http://52.29.160.34:8888/api/projects/1001/versions/51896/content
         */
        function requestContent(url, clb) {
            var xhr = new XMLHttpRequest()
            xhr.open('GET', url)
            xhr.onload = function () {
                if (xhr.status !== 200) {
                    //TODO error UI
                } else {
                    try {
                        var json = JSON.parse(xhr.responseText)
                        clb(json)
                    } catch (err) {
                        console.error(err.message)
                        showError()
                    }
                }
            }
            xhr.send()
        }

        function getFileUrl(files, mediaType) {
            for (var i = 0; i < files.length; i++) {
                if (files[i].mediaType === mediaType) {
                    return files[i].url
                }
            }
        }

        function createRemixContainer(
            container,
            features,
            htmlUrl,
            scriptUrl,
            cssUrl,
            commonjsUrl,
            minWidth,
            height,
            initedEventHandler,
        ) {
            return new window.RemixContainer({
                mode: 'published',
                width: minWidth,
                height: height,
                url: htmlUrl,
                element: container,
                features,
                scriptUrl: scriptUrl,
                cssUrl: cssUrl,
                commonjsUrl,
                onEvent: function (name, data) {
                    if (name === 'embedded') sendStatToGA(gaTrackerName, {category: statCategory, action: 'app_embedded'})
                    else if (name === 'inited') {
                        sendStatToGA(gaTrackerName, {category: statCategory, action: 'app_inited'})

                        initedEventHandler(name, data)
                    }
                },
            })
        }

        /**
         * Инициализировать Google Analytics api
         * @param cnt куда встроить скрипт ga
         */
        function initGA(cnt) {
            if (!window.ga) {
                var gaCode =
                    "<script>(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');ga('create', '{{ga_id}}', 'auto', {{params}});ga('" +
                    gaTrackerName +
                    ".send', 'pageview');{{init_event}}</script>"
                gaCode = gaCode.replace('{{ga_id}}', gaId)
                gaCode = gaCode.replace('{{params}}', "{'name':'" + gaTrackerName + "'}")
                gaCode = gaCode.replace(
                    '{{init_event}}',
                    "ga('" + gaTrackerName + ".send', 'event', '" + statCategory + "', 'Init_analytics');",
                )
                var d = document.createElement('div')
                d.innerHTML = gaCode
                cnt.appendChild(d.firstChild)
            } else {
                window.ga('create', gaId, 'auto', { name: gaTrackerName })
            }
        }

        /**
         * Вставить метку "TESTIX" со ссылкой на сайт
         *
         * @param cnt контейнер куда вставить
         * @param {string} [labelMod] - возможность установить модификатор для иконки (например, "__small" для панорам)
         */
        function createPoweredLabel(cnt, labelMod) {
            labelMod = labelMod || ''
            var s =
                '<a href="http://testix.me" target="_blank" class="tstx_pwrd ' +
                labelMod +
                '" onclick="testix.onLabelClick()"></a>'
            var div = document.createElement('div')
            div.innerHTML = s
            cnt.appendChild(div.firstChild)
        }

        /**
         * Клик на иконку сервиса в углу проекта.
         * Для сбора статистики
         *
         * @param e
         */
        function onLabelClick(e) {
            sendStatToGA(gaTrackerName, {category: statCategory, action: 'Label_click'})
        }

        // public
        global.init = init
        global.getApps = function () {
            return remixApps
        }
        global.onLabelClick = onLabelClick
    })(window.remix_interacty)
}
// можно запускать несколько раз, например, если появятся новые ембеды
// или же теги встроены непоследовательно
window.remix_interacty.init()
/**
 * some styles for container and editor
 */
//import './css/main.css'

window.Rmx = window.Rmx || {
    Containers: {},
    Util: {
        getOrigin: function (url) {
            var parser = document.createElement('a')
            parser.href = url
            return parser.origin
        },
        createNodeFromHTML: function (html) {
            var div = document.createElement('div')
            div.innerHTML = html.trim()
            return div.firstChild
        },
        sortFactory: function (prop) {
            return function (a, b) {
                return a[prop].localeCompare(b[prop])
            }
        },
        isHashlist: function (value) {
            return !!(value && value._orderedIds)
        },
        rand: function () {
            return Math.random().toString(36).substr(4)
        },
        getParentPropPath: function (propPath) {
            var pp = propPath.split('.')
            pp.pop()
            return pp.join('.')
        },
    },
}

/**
 * Constructor function 'RemixContainer' for container creation
 */
window.RemixContainer = function RemixContainer({
    url = null,
    scriptUrl = null,
    cssUrl = null,
    commonjsUrl = null,
    element = null,
    features = [],
    defaults = null,
    /**
     * width применяется только в режиме редактирования, для опубликованных проектов смотри maxWidth (optional)
     */
    width = 800,
    height = 600,
    marginTop = undefined,
    marginBottom = undefined,
    containerLog = false,
    remixLog = false,
    mode = 'none',
    onEvent = null,
    forceRestart = false,
    /**
     * ограничить ли ширину проекта maxWidth, если нет то тогда сайт клиента отвечает за ширину и проект будет растянуться максимально
     * так например на сайте interacty.me мы имеено так и делаем, всегда ширина приложения фиксирована контейнером, то есть не надо ставить maxWidth
     */
    maxWidth = 800,
    noRender = false,
}) {
    if (typeof url !== 'string') {
        throw Error('url must be a string')
    }
    if (typeof scriptUrl !== 'string') {
        throw Error('scriptUrl must be a string')
    }
    if (typeof cssUrl !== 'string') {
        throw Error('cssUrl must be a string')
    }
    if (!element) {
        throw Error('element is not specified')
    }

    // create unique session for this container
    this.sessionId = window.Rmx.Util.rand()
    element.setAttribute('data-ssid', this.sessionId)
    window.window.Rmx.Containers[this.sessionId] = this

    this.appOrigin = window.Rmx.Util.getOrigin(url) // like 'http://localhost:3000/';
    this.schema = null
    this.mode = mode
    this.containerLog = containerLog
    this.remixLog = remixLog
    if (defaults !== null && typeof defaults !== 'string') {
        throw new Error('"defaults" - json string expected to set default app state')
    }
    this.defaults = defaults
    this.screens = []
    this.controlViews = []
    this.properties = []
    this.serializedProperties = {}
    this.selectedControlPanelIndex = -1
    this.onEvent = onEvent
    this.operationsCount = 0
    this.width = width
    this.height = height
    this.marginTop = marginTop
    this.marginBottom = marginBottom
    this.element = element
    this.features = features
    this.iframe = null
    this.preloader = this.createPreloader()
    this.receiveMessageListeners = []
    this.maxWidth = maxWidth
    this.noRender = noRender

    this.lng = void 0
    try {
        this.lng = window.localStorage.getItem('lng').split('-')[0]
        if (!this.lng) {
            this.lng = window.navigator.language
        }

        if (!this.lng) {
            this.lng = 'en'
        }
    } catch (err) {}

    if (element.innerHTML.indexOf('<iframe') < 0 || forceRestart) {
        element.innerHTML = ''
        element.className = 'remix_cnt'
        element.style.position = 'relative'
        element.style.margin = '0 auto'
        element.style.overflow = 'hidden'
        if (this.mode === 'edit' || this.mode === 'preview') {
            // нужна дополнительная область при редактировании для операций
            element.style.width = '100%'
            element.style.height = '100%'
        }
        else {
            if (height === 'auto') {
                // установить какой-то изначальный размер вслепую, затем айфрейм подстроится под размер контента
                // приложение пришлет событие setSize
                element.style.height = '600px'
            }
            else {
                element.style.height = height + 'px'
            }
            if (maxWidth) {
                element.style.maxWidth = maxWidth + 'px'
            }
        }
        window.addEventListener('message', this.receiveMessage.bind(this), false)
        this.element.appendChild(this.preloader.render())
        if (Array.isArray(this.features) && !this.features.includes('NO_LOGO') && this.mode === 'published') {
            this.element.appendChild(this.createPoweredLabel())
        }
        this.iframe = this.createIframe(url, element, scriptUrl, cssUrl, commonjsUrl)
    }
}

/**
 * @param {(options: {method: string}) => void} callbackfn
 */
RemixContainer.prototype.addReceiveMessageListener = function (callbackfn) {
    this.receiveMessageListeners.push(callbackfn)
}

/**
 * Create iframe for Remix application
 *
 * @param {string} url iframe src url
 * @param {HTMLElement} parentNode
 * @param {string} scriptUrl - additional script to add into app
 * @param {string} cssUrl - additional css file to add on app page
 * @param {string} commonjsUrl - additional common script to add into app
 *
 * @returns {HTMLElement}
 */
window.RemixContainer.prototype.createIframe = function (url, parentNode, scriptUrl, cssUrl, commonjsUrl) {
    var iframe = document.createElement('iframe')
    iframe.id = 'remix-iframe'
    iframe.setAttribute('allowFullScreen', '')
    iframe.style.border = 0
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.overflow = 'hidden'
    var self = this
    iframe.onload = function (event) {
        // self.log('embed message sent');
        self.parentNode = parentNode
        self.iframe = iframe
        self.iframe.contentWindow.postMessage(
            {
                method: 'embed',
                script: scriptUrl,
                css: cssUrl,
                commonjs: commonjsUrl,
            },
            self.appOrigin,
        )
    }
    iframe.src = url
    parentNode.appendChild(iframe)
    return iframe
}

window.RemixContainer.prototype.sendEvent = function (name, data) {
    if (this.onEvent) {
        this.onEvent(name, data)
    }
}

window.RemixContainer.prototype.setCurrentScreen = function (screenId) {
    // this.log('setcurrentscreen message sent');
    this.iframe.contentWindow.postMessage(
        {
            method: 'setcurrentscreen',
            screenId: screenId,
        },
        this.appOrigin,
    )
}

window.RemixContainer.prototype.selectComponents = function (componentIds) {
    // this.log('select message sent');
    this.iframe.contentWindow.postMessage(
        {
            method: 'select',
            componentIds: componentIds,
        },
        this.appOrigin,
    )
}

window.RemixContainer.prototype.receiveMessage = function ({ origin = null, data = {}, source = null }) {
    // In current "window" we may have many window.RemixContainers with many "receiveMessage" handlers, but window is the same!
    // Must check iframe source
    if (!this.iframe || this.iframe.contentWindow !== source || origin !== this.appOrigin) {
        return
    }
    // this.log(data.method + ' message received. ', data);
    if (data.method === 'embedded') {
        this.sendEvent('embedded')
        var initData = {
            method: 'init',
            mode: this.mode,
            log: this.remixLog,
            defaults: this.defaults ? this.defaults : '',
            lng: this.lng,
            noRender: this.noRender,
        }
        if (this.mode === 'edit') {
            initData.marginTop = this.marginTop
            initData.marginBottom = this.marginBottom
            initData.fixedRootWidth = this.width
            initData.fixedRootHeight = this.height
        }
        this.iframe.contentWindow.postMessage(initData, this.appOrigin)

        if (this.mode !== 'edit') {
            const mobileMaxWidth = 751

            this.getAppBoundingClientRect(rect => {
                this.setData({
                    'app.screen': rect.width <= mobileMaxWidth ? 'mobile' : 'desktop',
                })
            })

            const maxWidthState = window.matchMedia(`(max-width: ${mobileMaxWidth}px)`)
            maxWidthState.addListener(state => {
                this.setData({
                    'app.screen': state.matches ? 'mobile' : 'desktop',
                })
            })
        }
    } else if (data.method === 'inited') {
        this.preloader.hideAndDestroy()
        this.sendEvent('inited', data)
        this.schema = data.schema
        this.setSize(data)
    } else if (data.method === 'properties_updated') {
        if (this.mode === 'edit') {
            this.sendEvent('properties_updated', data)
        }
        this.operationsCount++
    } else if (data.method === 'serialized') {
        this.serializedProperties = JSON.parse(data.state)
        if (this.serializeClb) {
            this.serializeClb(this.serializedProperties)
        }
    } else if (data.method === 'app_bounding_client_rect') {
        if (this.boundingClientRectClb) {
            this.boundingClientRectClb(data.rect)
        }
    } else if (data.method === 'share_entities') {
        if (this.getShareEntitiesClb) {
            this.getShareEntitiesClb(data.share)
        }
    } else if (data.method === 'personality_distribution') {
        if (this.getPersonalityDistributionClb) {
            this.getPersonalityDistributionClb(data)
        }
    } else if (data.method === 'trivia_distribution') {
        if (this.getTriviaDistributionClb) {
            this.getTriviaDistributionClb(data)
        }
    } else if (data.method === 'screens_updated') {
        //data.added, data.changed, data.deleted
        //TODO screens: basic sync algorythm
        if (this.mode === 'edit') {
            this.sendEvent('screens_updated', data)
        }
    } else if (data.method === 'request_data_layer') {
        if (this.mode === 'edit') {
            this.sendEvent('request_data_layer', data)
        }
    } else if (data.method === 'shareDialog') {
        //stat('TestixLoader','Share_Dialog_Open', event.data.provider);
    } else if (data.method === 'requestSetSize') {
        this.setSize(data.size)
    } else if (data.method === 'selected') {
        this.sendEvent('selected', data)
    } else if (data.method === 'request_popup_edit_mode') {
        if (this.mode === 'edit') {
            this.sendEvent('request_popup_edit_mode', data)
        }
    } else if (data.method === 'request_popups_edit_mode') {
        if (this.mode === 'edit') {
            this.sendEvent('request_popups_edit_mode', data)
        }
    }

    for (const listener of this.receiveMessageListeners) listener(data)
}

/**
 * This container change its size. Remix app subscribed on window resize.
 */
window.RemixContainer.prototype.setSize = function ({maxWidth, width, height}) {
    // console.log('SET_SIZE ', maxWidth, width, height)
    if (this.mode === 'edit') {
        // в режиме редактирования когда iframe превращен в широкий артборд, размер приложения надо менять непосредственно у контейнера ремикс
        this.iframe.contentWindow.postMessage(
            {
                method: 'set_remix_container_size',
                size: { width, height },
            },
            this.appOrigin,
        )
    }
    else {
        if (width) {
            this.element.style.width = width + 'px'
            this.width = width
        }
        if (height) {
            this.element.style.height = height + 'px'
            this.height = height
        }
        if (maxWidth) {
            this.element.style.maxWidth = maxWidth + 'px'
            this.maxWidth = maxWidth
        }
    }
}

/**
 * Sync local screens with application
 * Application sent screen modifications: "added", "changed", "deleted" arrays
 */
window.RemixContainer.prototype.syncScreens = function (screens, added, changed, deleted) {
    if (added.length === 0 && changed.length === 0 && deleted.length === 0) {
        throw Error('No screen modifications')
    }
    var result = screens.splice(0)
    if (deleted.length > 0) {
        for (var i = 0; i < deleted.length; i++) {
            var s = this.getScreen(deleted[i].screenId, screens)
            if (s) {
                result.splice(i, 1)
            }
        }
    }
    if (added.length > 0) {
        //throw already exist
    }
    if (changed.length > 0) {
    }
    return result
}

window.RemixContainer.prototype.getScreen = function (id, screens) {
    return screens && screens.length > 0 ? screens.find(s => s.screenId === id) : null
}

/**
 * Sends the message with new data to app
 */
window.RemixContainer.prototype.setData = function (
    data,
    forceFeedback = true,
    immediate = false,
    calcConditions = true,
) {
    this.log('setdata message sent')
    this.iframe.contentWindow.postMessage(
        {
            method: 'setdata',
            data: data,
            forceFeedback,
            immediate,
            calcConditions,
        },
        this.appOrigin,
    )
}

window.RemixContainer.prototype.addHashlistElement = function (propertyPath, index, newElement) {
    this.log('addhashlistelement message sent')
    this.iframe.contentWindow.postMessage(
        {
            method: 'addhashlistelement',
            propertyPath,
            index,
            newElement,
        },
        this.appOrigin,
    )
}

window.RemixContainer.prototype.insertAfterHashlistElement = function (propertyPath, beforeId, newElement) {
    this.log('insertafterhashlistelement message sent')
    this.iframe.contentWindow.postMessage(
        {
            method: 'insertafterhashlistelement',
            propertyPath,
            beforeId,
            newElement,
        },
        this.appOrigin,
    )
}

window.RemixContainer.prototype.cloneHashlistElement = function (propertyPath, elementId) {
    this.log('clonehashlistelement message sent')
    this.iframe.contentWindow.postMessage(
        {
            method: 'clonehashlistelement',
            propertyPath,
            elementId,
        },
        this.appOrigin,
    )
}

/**
 * Указать элемент который перемещаем можно двумя способами: elementId | elementIndex
 * Указать новую позицию можно тоже двумя способами: newElementIndex | delta
 */
window.RemixContainer.prototype.changePositionInHashlist = function (
    propertyPath,
    { elementId, elementIndex, newElementIndex, delta },
) {
    this.log('changepositioninhashlist message sent')
    this.iframe.contentWindow.postMessage(
        {
            method: 'changepositioninhashlist',
            propertyPath,
            elementId,
            elementIndex,
            newElementIndex,
            delta,
        },
        this.appOrigin,
    )
}

window.RemixContainer.prototype.deleteHashlistElement = function (propertyPath, elementId) {
    this.log('deletehashlistelement message sent')
    this.iframe.contentWindow.postMessage(
        {
            method: 'deletehashlistelement',
            propertyPath,
            elementId,
        },
        this.appOrigin,
    )
}

window.RemixContainer.prototype.serialize = function (clb) {
    this.serializeClb = clb
    this.log('serialize message sent')
    this.iframe.contentWindow.postMessage(
        {
            method: 'serialize',
        },
        this.appOrigin,
    )
}

/**
 * Запросить у приложения позицию контейнера приложения "remix-app-root"
 * Полезно в режиме редактирования, так как область редактирования расширена, а "remix-app-root" находится где-то в центре
 */
window.RemixContainer.prototype.getAppBoundingClientRect = function (clb) {
    this.boundingClientRectClb = clb
    this.iframe.contentWindow.postMessage(
        {
            method: 'getappboundingclientrect',
        },
        this.appOrigin,
    )
}

/**
 * Запросить всю информацию по шарингам
 * Просто возвращается целиком state.app.share
 */
window.RemixContainer.prototype.getShareEntities = function (clb) {
    this.getShareEntitiesClb = clb
    this.iframe.contentWindow.postMessage(
        {
            method: 'getshareentities',
        },
        this.appOrigin,
    )
}

/**
 * Запросить информацию по распределению Personality
 */
window.RemixContainer.prototype.getPersonalityDistribution = function (links, probabilityOnly, probabilityType, clb) {
    this.getPersonalityDistributionClb = clb
    this.iframe.contentWindow.postMessage(
        {
            method: 'getpersonalitydistribution',
            payload: {
                links,
                probabilityOnly,
                probabilityType
            }
        },
        this.appOrigin,
    )
}

/**
 * Запросить информацию по распределению Personality
 */
window.RemixContainer.prototype.getTriviaDistribution = function (clb) {
    this.getTriviaDistributionClb = clb
    this.iframe.contentWindow.postMessage(
        {
            method: 'gettriviadistribution'
        },
        this.appOrigin,
    )
}

/**
 * Установить свойства шаринга
 * Переданные свойства перепишут те, что есть в приложении. Если какие-то не передать ничего не произойдет
 * То есть удалить шаринги нельзя, если не передать какой-то sharing_id.
 *
 * Формат такой же какой возвращает getShareEntities()
 * @param {object} data {
 *      entities: {
 *          'as3wre': {
 *              ...
 *          }
 *      },
 *      defaultTitle: 'new title',
 *      defaultDescription: 'new descr',
 *          ...
 * }
 */
window.RemixContainer.prototype.setShareEntities = function (data) {
    this.iframe.contentWindow.postMessage(
        {
            method: 'setshareentities',
            data,
        },
        this.appOrigin,
    )
}

window.RemixContainer.prototype.deserialize = function (json) {}

window.RemixContainer.prototype.getOperationsCount = function () {
    return this.operationsCount
}

window.RemixContainer.prototype.undo = function () {
    this.iframe.contentWindow.postMessage(
        {
            method: 'undo',
        },
        this.appOrigin,
    )
}

window.RemixContainer.prototype.redo = function () {
    this.iframe.contentWindow.postMessage(
        {
            method: 'redo',
        },
        this.appOrigin,
    )
}

// =========================================================================================================
// =========================================================================================================
// Helper Methods below
// =========================================================================================================
// =========================================================================================================

window.RemixContainer.prototype.stat = function () {
    //TODO
}

window.RemixContainer.prototype.log = function (...message) {
    if (this.containerLog) {
        console.log('RContainer:', ...message)
    }
}

/**
 * Create remix preloader instance
 *
 */
window.RemixContainer.prototype.createPreloader = function () {
    const MIN_ANIMATION_DELAY = 1000
    const ANIMATION_DURATION = 500
    const html = `
        <div
            data-remix-preloader
            style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; background-color: #fff; transition: opacity ${ANIMATION_DURATION}ms; opacity: 1;"
        >
            <img src="${
                process.env.REACT_APP_STATIC_URL
            }/static/media/preloader.gif?v=${Math.random()} alt="preloader" style="display: block; width: 100%; max-width: 380px; margin: 130px auto 0;" />
         </div>`
    const element = window.Rmx.Util.createNodeFromHTML(html)
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

window.RemixContainer.prototype.createPoweredLabel = function () {
    const html = `
        <a href="${process.env.REACT_APP_STATIC_URL}" target="_blank">
    <img src="${process.env.REACT_APP_STATIC_URL}/static/media/powered_by.svg" style="position: absolute; bottom: 0; right: 0;" alt="powered by interacty" />
    </a>
        `
    const element = window.Rmx.Util.createNodeFromHTML(html)
    return element
}