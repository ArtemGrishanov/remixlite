import BLOCK from "../blocks/blocksEnum";

export default (type = 'log', blockType = '[NO BLOCK TYPE]', blockId = '[NO BLOCK ID]', message = '[NO ERROR MESSAGE]', data = null) => {
    let blockLabel = BLOCK.getLabel(blockType)
    console[type](`[RemixLite | Block type: ${blockType} : ${blockLabel}, ID: ${blockId}] ${message}`, data ? data : '');
}
