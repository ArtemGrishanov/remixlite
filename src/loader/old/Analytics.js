import { createAction } from './api'

/**
 * @typedef {{type: string, actionType: string}} Action
 */
/**
 * @typedef {{engagement: number}} EngagementAction
 */

// на всякий случай продублирую, что отсылается в экшнах (должно отсылаться)
// 1. TEST_STARTED - отсылается, после нажатия на кнопку "старт" у теста
// 2. TEST_QUESTION_STARTED - отсылается при старте вопроса (для тестов, где есть вопросы вообще, ProjectTypeEnum.TEST, ProjectTypeEnum.PERSONALITY, ProjectTypeEnum.RANK_BATTLE)
// 3. TEST_QUESTION_ANSWERED - отсылается при ответе на вопрос (для тестов, где есть ответы на вопросы, ProjectTypeEnum.TEST, ProjectTypeEnum.PERSONALITY, ProjectTypeEnum.RANK_BATTLE)
// 4. TEST_ENDED - отсылается при конце теста, когда страница результатов показывается (ProjectTypeEnum.TEST, ProjectTypeEnum.PERSONALITY)
// 5. TEST_RESULT_DOWNLOADED - для любых
// 6. TEST_RESULT_SHARED - для любых
// 7. PASS_TEST_AGAIN_CLICKED - для любых, где была кнопка "начать тест заного" (при прохождении теста заного)
// 8. BUTTON_CLICKED ("type": "RANK_BATTLE") - для нажатий кнопки батл ранк

class Analytics {
    /**
     * @type {Action[]} key: typeof Action.actionType
     */
    _actions = []
    /**
     * @type {{[key: string]: Action}} key: typeof Action.actionType
     */
    _engagementActions = {}
    /**
     *
     */
    _conversionActionIds = {}

    constructor() {
        window.addEventListener('beforeunload', this._submitData)
        window.addEventListener('blur', this._submitData)

        setInterval(this._submitData, 60 * 1000)
    }

    /**
     * @typedef {{method: string} & {[key: string]: any}} TriggerData
     * @param {TriggerData} data
     */
    trigger = data => {
        delete data['method']

        const type = (data.type = data.type.toUpperCase())
        const actionType = (data.actionType = data.actionType.toUpperCase())

        switch (type) {
            case 'ENGAGEMENT': {
                const prev = this._engagementActions[actionType]

                if (prev === void 0 || prev.engagement < data.engagement) this._engagementActions[actionType] = data

                break
            }
            case 'CONVERSION': {
                if (actionType in this._conversionActionIds) {
                    data.projectActionId = this._conversionActionIds[actionType]
                } else {
                    return
                }
            }
            default:
                this._actions.push(data)

                break
        }
    }

    /** */
    setConversionActionIds = types => (this._conversionActionIds = types)

    _submitData = () => {
        for (const key in this._engagementActions) this._actions.push(this._engagementActions[key])
        for (let i = 0; i < this._actions.length; i++) createAction(this._actions[i])

        this._engagementActions = {}
        this._actions.length = 0
    }
}

export default Analytics
