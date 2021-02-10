export const getCoords = (elem) => {
    const box = elem.getBoundingClientRect();
    return {
        top: box.top,
        left: box.left
    };
}

export const updateEventListeners = (domElement, handlers, additionalPayload = {}) => {
    if (domElement) {
        const handledElements = domElement.getElementsByClassName("is-handled");
        for (const el of handledElements) {
            for (const handle of el.dataset.handlers.split('|')) {
                el.addEventListener(handle, evt => handlers[handle]({
                    initiator: el.dataset.initiator,
                    payload: {
                        ...el.dataset,
                        ...additionalPayload
                    }
                }, evt))
            }
        }
    }
}

//Lodash throttle
// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time. Normally, the throttled function will run
// as much as it can, without ever going more than once per `wait` duration;
// but if you'd like to disable the execution on the leading edge, pass
// `{leading: false}`. To disable execution on the trailing edge, ditto.
export const throttle = (func, wait, options) => {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
        previous = options.leading === false ? 0 : Date.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
    };
    return function() {
        var now = Date.now();
        if (!previous && options.leading === false) previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };
};

export const calculateCardSideSize = (wrapperWidth, cardCount, proportion = 1) => {
    return (wrapperWidth / cardCount) * proportion
}

export const getUniqueId = () => {
    let firstPart = (Math.random() * 46656) | 0
    let secondPart = (Math.random() * 46656) | 0
    firstPart = ('000' + firstPart.toString(36)).slice(-3)
    secondPart = ('000' + secondPart.toString(36)).slice(-3)
    return firstPart + secondPart
}

export const getCardsDataSet = (cardLayout, pairList, coverSrc) => {
    const [cellCount, rowCount] = cardLayout.split('x').map(x => Number(x))
    const isValidProp = x => typeof x === 'number' && x > 0

    if (!isValidProp(rowCount) && !isValidProp(cellCount)) {
        return console.warn('[Memory]: Bad props from cardRowsCount!')
    }

    const pairsCount = (rowCount * cellCount) / 2

    let tmpPairList = []
    if (pairList.length) {
        // Add or remove cards
        if (pairList.length < pairsCount) {
            tmpPairList = [...pairList]
            while (pairList.length < pairsCount) {
                arrSet.push({
                    id: getUniqueId(),
                    description: '',
                    firstImage: {
                        id: undefined,
                        src: '',
                    },
                    secondImage: {
                        id: undefined,
                        src: '',
                    },
                })
            }
        } else if (pairList.length > pairsCount) {
            tmpPairList = pairList.slice(0, pairsCount)
        } else {
            tmpPairList = [...pairList]
        }
    }

    // Format to render specific view
    const renderSet = []
    if (tmpPairList.length) {
        const tmpRenderSet = tmpPairList
            .reduce((acc, item) => {
                acc.push({
                    isActive: false,
                    id: getUniqueId(),
                    src: item.firstImage.src,
                    coverSrc: coverSrc,
                    pairId: item.id,
                });
                acc.push({
                    isActive: false,
                    id: getUniqueId(),
                    src: item.secondImage.src,
                    coverSrc: coverSrc,
                    pairId: item.id,
                });
                return acc
            }, [])
            .sort(() => Math.random() - 0.5)

        for (let i = 0; i < rowCount; i++) {
            const row = tmpRenderSet.splice(0, cellCount).sort(() => Math.random() - 0.5)
            renderSet.push(row)
        }
    }

    return renderSet
}