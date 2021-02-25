import _normalizeUrl from 'normalize-url'

export const normalizeUrl = (url, { defaultProtocol = 'https:', forceHttps = false }) => {
    try {
        return _normalizeUrl(url, {
            defaultProtocol,
            forceHttps
        })
    } catch (err) {
        console.error(err)
        return url
    }
}