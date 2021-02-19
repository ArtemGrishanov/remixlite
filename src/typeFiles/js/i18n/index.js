import translations from './translations'

export const DICTIONARY_LANGUAGES = ['ru']
const DEFAULT_LOCALE = 'en'
let LANGUAGE = undefined

export function setLanguage(name) {
    LANGUAGE = name && DICTIONARY_LANGUAGES.includes(name) ? name : DEFAULT_LOCALE
}
export function getTranslation(key) {
    // if we have default locale as active lng - return key
    if (LANGUAGE === DEFAULT_LOCALE) {
        return key
    }

    // check is key's exist
    if (translations.hasOwnProperty(key) && translations[key].hasOwnProperty(LANGUAGE)) {
        // return translation
        return translations[key][LANGUAGE]
    }
    // return key if not exist
    return key
}

