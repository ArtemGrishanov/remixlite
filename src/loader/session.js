import API from './api'

export default class SESSION {
    #createdSession = null

    #inProgress = false

    #clientId
    #projectId
    #utmCampaign
    #utmSource
    #utmMedium
    #utmContent
    #referenceTail
    #sourceReference

    constructor({clientId, projectId, utmCampaign, utmSource, utmMedium, utmContent, referenceTail, sourceReference}) {
        this.#clientId = clientId
        this.#projectId = projectId
        this.#utmCampaign = utmCampaign
        this.#utmSource = utmSource
        this.#utmMedium = utmMedium
        this.#utmContent = utmContent
        this.#referenceTail = referenceTail
        this.#sourceReference = sourceReference
    }

    // Send activity to server
    sendActivity = async () => {
        try {
            if (!this.#inProgress) {
                this.#inProgress = true
                if (!this.#createdSession) {
                    this.#createdSession = await API.createSession(this.#clientId, this.#projectId, {
                        utmCampaign: this.#utmCampaign,
                        utmSource: this.#utmSource,
                        utmMedium: this.#utmMedium,
                        utmContent: this.#utmContent,
                        referenceTail: this.#referenceTail,
                        sourceReference: this.#sourceReference
                    });
                } else {
                    await API.refreshSession(this.#clientId, this.#createdSession.id)
                }
                this.#inProgress = false
            }
        } catch (err) {
            console.error(err);
            this.#inProgress = false
        }
    }
}