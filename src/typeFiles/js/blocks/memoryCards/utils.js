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