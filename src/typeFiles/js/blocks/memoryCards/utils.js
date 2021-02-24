import getRandomId from "../../utils/getRandomId";
import log from "../../utils/log";
import {DEFAULT_IMAGE_URL} from "../../utils/constants";

export const getCoords = (elem) => {
    const box = elem.getBoundingClientRect();
    return {
        top: box.top,
        left: box.left
    };
}

export const updateEventListeners = (domElement, handlers, additionalPayload = {}) => {
    if (domElement) {
        try {
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
        } catch (err) {
            log('error', '11 (MemoryCards)', data.id, null, err)
        }
    }
}

export function CreateStopwatch() {
    this.isPaused = false
    this.timer = null
    this.second = 0
    this.minute = 0
    this.startTimer = (callback) => {
        this.timer = setInterval(() => {
            if (!this.isPaused) {
                this.second++;
                if (this.second == 60) {
                    this.minute++;
                    this.second = 0;
                }
                callback({minute: this.minute, second: this.second})
            }
        }, 1000);
    }
    this.clearTimer = () => {
        clearInterval(this.timer)
        this.isPaused = false
        this.timer = null
        this.second = 0
        this.minute = 0
    }
    this.pauseTimer = () => {
        this.isPaused = true
    }
    this.unPauseTimer = () => {
        this.isPaused = false
    }
    this.isTimerStarted = () => !!this.timer
    this.getTime = () => `${String(this.minute).padStart(2, '0')}:${String(this.second).padStart(2, '0')}`
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
    const cardsSet = []
    if (tmpPairList.length) {
        const flatCardList = tmpPairList
            .reduce((acc, item) => {
                acc.push({
                    isActive: false,
                    id: getRandomId(),
                    src: item.firstImage.src ? item.firstImage.src : DEFAULT_IMAGE_URL,
                    coverSrc: coverSrc ? coverSrc : DEFAULT_IMAGE_URL,
                    pairId: item.id,
                });
                acc.push({
                    isActive: false,
                    id: getRandomId(),
                    src: item.secondImage.src ? item.firstImage.src : DEFAULT_IMAGE_URL,
                    coverSrc: coverSrc ? coverSrc : DEFAULT_IMAGE_URL,
                    pairId: item.id,
                });
                return acc
            }, [])
            .sort(() => Math.random() - 0.5)

        for (let i = 0; i < rowCount; i++) {
            const row = flatCardList.splice(0, cellCount).sort(() => Math.random() - 0.5)
            cardsSet.push(row)
        }
    }

    return cardsSet
}

export const getMobileCardLayout = (webLayout) => {
    switch (webLayout.value) {
        case '6x6': {
            return {
                value: '4x9',
                label: '4x9'
            }
        }
        case '6x4': {
            return {
                value: '4x6',
                label: '4x6'
            }
        }
        default: {
            return webLayout
        }
    }
}

export const updateCardsDataSet = (cardLayout, dataSet) => {
    const [cellCount, rowCount] = cardLayout.split('x').map(x => Number(x))
    const isValidProp = x => typeof x === 'number' && x > 0

    if (!isValidProp(rowCount) && !isValidProp(cellCount)) {
        return console.warn('[Memory]: Bad props from cardRowsCount!')
    }

    const flatCardList = dataSet.reduce((acc, row) => {
        acc = [...acc, ...row]
        return acc
    },[])

    const cardsSet = []
    if (flatCardList.length) {
        for (let i = 0; i < rowCount; i++) {
            const row = flatCardList.splice(0, cellCount)
            cardsSet.push(row)
        }
    }
    return cardsSet
}
