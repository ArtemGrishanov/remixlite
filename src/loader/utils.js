export const httpRequest = async (resource, options) => {
    const { timeout = 30000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    if (!response.ok) {
        throw new Error('Request is failed')
    }
    return response;
}

export const validator = {
    isValue: value => {
        try {
            return value !== void 0 && value !== null
        } catch (err) {
            return false
        }
    },
    isJsonString: value => {
        try {
            return (JSON.parse(value) && !!value);
        } catch (err) {
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
    isNumber: value => {
        return typeof value === 'number' && isFinite(value)
    }
}

export const throttle = (func, waitTime) => {
    let isThrottled = false,
        savedArgs,
        savedThis;

    function wrapper() {
        if (isThrottled) {
            savedArgs = arguments;
            savedThis = this;
            return;
        }
        func.apply(this, arguments);
        isThrottled = true;
        setTimeout(function() {
            isThrottled = false;
            if (savedArgs) {
                wrapper.apply(savedThis, savedArgs);
                savedArgs = savedThis = null;
            }
        }, waitTime);
    }

    return wrapper;
}