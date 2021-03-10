const BLOCK = {
    text: 1,
    image: 2,
    embedInteractyProject: 3,
    flipCards: 4,
    youtubeVideo: 5,
    button: 6,
    interactiveImage: 7,
    hiddenObjects: 8,
    quiz: 9,
    thenNow: 10,
    memoryCards: 11,
    timeline: 12,
    cookies: 13,
    horoscope: 14,
}

const reversedBlocks = {}
Object.keys(BLOCK).forEach((key) => { reversedBlocks[BLOCK[key]] = key})

BLOCK.getLabel = function(value){ return reversedBlocks[value]}

Object.freeze(BLOCK)

export default BLOCK
