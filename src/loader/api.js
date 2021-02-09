import { API_URL } from './constants'
import { httpRequest } from "./utils"

const createSession = async (clientId, projectId, { utmCampaign, utmSource, utmMedium, utmContent, referenceTail, sourceReference }) => {
    try {
        const response = await httpRequest(`${API_URL}/api/sessions`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Client-Key': clientId
            },
            body: JSON.stringify({
                id: null,
                projectId,
                utmCampaign: utmCampaign ? utmCampaign.slice(0, 128) : null,
                utmSource: utmSource ? utmSource.slice(0, 128) : null,
                utmMedium: utmMedium ? utmMedium.slice(0, 128) : null,
                utmContent: utmContent ? utmContent.slice(0, 128) : null,
                referenceTail: referenceTail ? referenceTail.slice(1, 513) : null,
                sourceReference: sourceReference ? sourceReference.slice(0, 512) : null
            }),
            timeout: 10000
        });
        return await response.json();
    } catch (err) {
        throw err
    }
}

const refreshSession = async (clientId, sessionId) => {
    try {
        await httpRequest(`${API_URL}/api/sessions/${sessionId}/refresh`, {
            method: 'PATCH',
            headers: {
                'Client-Key': clientId
            },
            timeout: 7000
        });
    } catch (err) {
        throw err
    }
}

const getProjectMetaInfo = async hash => {
    try {
        const response = await httpRequest(`${API_URL}/api/projects/${hash}/meta`, {
            timeout: 4000
        })
        return await response.json()
    } catch (err) {
        throw err
    }
}

const sendProjectReadPercent = async (clientId, sessionId, { value }) => {
    try {
        await httpRequest(`${API_URL}/api/actions/read`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Client-Key': clientId
            },
            body: JSON.stringify({
                sessionId,
                readPercent: value
            }),
            timeout: 3000
        });
    } catch (err) {
        throw err
    }
}

export default {
    createSession,
    refreshSession,
    getProjectMetaInfo,
    sendProjectReadPercent
}