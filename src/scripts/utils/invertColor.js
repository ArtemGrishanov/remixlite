const padZero = (str, len) => {
    len = len || 2
    const zeros = new Array(len).join('0')
    return (zeros + str).slice(-len)
}
export default (hex, strict) => {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1)
    }
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.')
    }
    let r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16)
    if (strict) {
        return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000' : '#fff'
    }
    r = (255 - r).toString(16)
    g = (255 - g).toString(16)
    b = (255 - b).toString(16)
    return '#' + padZero(r) + padZero(g) + padZero(b)
}
