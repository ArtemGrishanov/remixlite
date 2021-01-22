export const validator = {
    isValue: value => {
        try {
            return value !== void 0 && value !== null
        } catch (err) {
            return false
        }
    },
    isJSON: value => {
        try {
            return (JSON.parse(value) && !!value);
        } catch (e) {
            return false;
        }
    },
    isURL: value => {
        try {
            const regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
            return regexp.test(value)
        } catch (err) {
            return false;
        }
    },
    isInt: value => {
        try {
            const regexp = /^[-+]?[0-9]+$/
            return regexp.test(value)
        } catch (err) {
            return false
        }
    }
}