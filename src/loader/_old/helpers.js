/**
 *
 * @param {({mediaType: string, url: string, name: string})[]} files
 * @param {"css"|"html"|"projectjs"|"commonjs"} type
 */
export const getProjectFileByType = (files, typ) => {
    let result = []

    if (typ === 'css') {
        result = files.filter(file => file.mediaType.includes(typ))
    }

    if (typ === 'html') {
        result = files.filter(file => file.mediaType.includes(typ))
    }

    if (typ === 'projectjs') {
        result = files.filter(file => file.mediaType.includes('javascript') && !file.url.includes('common.js'))
    }

    if (typ === 'commonjs') {
        result = files.filter(file => file.mediaType.includes('javascript') && file.url.includes('common.js'))
    }

    if (result === void 0 && typ !== 'commonjs') {
        throw Error(`can't find url in files: ${files} for type: ${typ}`)
    }

    return result.map(file => file.url)[0]
}
