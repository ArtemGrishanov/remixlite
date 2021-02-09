export const getCoords = (elem) => {
    const box = elem.getBoundingClientRect();
    return {
        top: box.top,
        left: box.left
    };
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

    let arrSet = []
    if (pairList.length) {
        // Add or remove cards
        if (pairList.length < pairsCount) {
            // let maxId = dataSetArray.sort(x => x.id)[dataSetArray.length - 1].id
            // while (dataSet.length < pairsCount) {
            //     dataSet.addElement({id: ++maxId, gameKey: null, src: null})
            // }
            // arrSet = dataSet.toArray()
        } else if (pairList.length > pairsCount) {
            arrSet = pairList.splice(0, pairsCount)
        } else {
            arrSet = [...pairList]
        }
    }

    // Format to render specific view
    let renderSet = []
    if (pairList.length) {

        const result = [];
        for (let i = 0; i < arrSet.length; i++) {
            const p = arrSet[i];
            result.push({
                isActive: false,
                id: getUniqueId(),
                src: p.firstImage.src,
                coverSrc: coverSrc,
                pairId: p.id,
            });
            result.push({
                isActive: false,
                id: getUniqueId(),
                src: p.secondImage.src,
                coverSrc: coverSrc,
                pairId: p.id,
            });
        }

        const tmpArr = result.sort(() => Math.random() - 0.5)


        for (let i = 0; i < rowCount; i++) {
            const row = tmpArr.splice(0, cellCount).sort(() => Math.random() - 0.5)
            renderSet.push(row)
        }
    }

    return renderSet
}

export const updateActive = (renderSet, cardId, isActive) => {
    const data = [...renderSet]
    const [row] = data.filter(x => x.some(y => y.id === cardId))
    const [_card] = row.filter(x => x.id === cardId)
    _card.isActive = isActive
    return data
}