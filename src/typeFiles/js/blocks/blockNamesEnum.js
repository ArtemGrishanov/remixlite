import BLOCK from "./blocksEnum";

const BLOCK_NAMES_DICTIONARY = Object.keys(BLOCK).reduce((blockNamesDictionary, blockName) => {
    blockNamesDictionary[BLOCK[blockName]] = blockName;
    return blockNamesDictionary;
},{});

export default BLOCK_NAMES_DICTIONARY;
