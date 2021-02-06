import { API_URL } from './constants'
import { httpRequest } from './utils'

export default class SESSION {
    #createdSession = null

    #isAwaiting = false

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
        this.#utmCampaign = utmCampaign || null
        this.#utmSource = utmSource || null
        this.#utmMedium = utmMedium || null
        this.#utmContent = utmContent || null
        this.#referenceTail = referenceTail || null
        this.#sourceReference = sourceReference || null
    }

    // [PUBLIC] Send activity to server
    sendActivity = async () => {
        try {
            if (!this.#isAwaiting) {
                this.#isAwaiting = true
                if (!this.#createdSession) {
                    const response = await httpRequest(`${API_URL}/api/sessions`, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Client-Key': this.#clientId
                        },
                        body: JSON.stringify({
                            id: null,
                            projectId: this.#projectId,
                            utmCampaign: this.#utmCampaign ? this.#utmCampaign.slice(0, 128) : null,
                            utmSource: this.#utmSource ? this.#utmSource.slice(0, 128) : null,
                            utmMedium: this.#utmMedium ? this.#utmMedium.slice(0, 128) : null,
                            utmContent: this.#utmContent ? this.#utmContent.slice(0, 128) : null,
                            referenceTail: this.#referenceTail ? this.#referenceTail.slice(1, 513) : null,
                            sourceReference: this.#sourceReference ? this.#sourceReference.slice(0, 512) : null
                        }),
                        timeout: 10000
                    });
                    this.#createdSession = await response.json();
                } else {
                    await httpRequest(`${API_URL}/api/sessions/${this.#createdSession.id}/refresh`, {
                        method: 'PATCH',
                        headers: {
                            'Client-Key': this.#clientId
                        },
                        timeout: 7000
                    });
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            this.#isAwaiting = false
        }
    }
}