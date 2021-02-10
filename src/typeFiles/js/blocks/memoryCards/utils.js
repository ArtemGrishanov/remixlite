import getRandomId from "../../utils/getRandomId";

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
                    id: getRandomId(),
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
                    id: getRandomId(),
                    src: item.firstImage.src,
                    coverSrc: coverSrc,
                    pairId: item.id,
                });
                acc.push({
                    isActive: false,
                    id: getRandomId(),
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