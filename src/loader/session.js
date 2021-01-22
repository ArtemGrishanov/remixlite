import { API_URL } from './constants'

export default class SESSION {
    #createdSession = null

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
            if (!this.#createdSession) {
                const response = await fetch(`${API_URL}/api/sessions`, {
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
                    })
                });
                this.#createdSession = await response.json();
            } else {
                await fetch(`${___API_URL___}/api/sessions/${this.#createdSession.id}/refresh`, {
                    method: 'PATCH',
                    headers: {
                        'Client-Key': this.#clientId
                    }
                });
            }
        } catch (err) {
            console.error(err);
        }
    }
}