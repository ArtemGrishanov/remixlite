export default (type = 'log', blockType = '[NO BLOCK TYPE]', blockId = '[NO BLOCK ID]', message = '[NO ERROR MESSAGE]', data = null) => {
    console[type](`[RemixLite | Block type: ${blockType}, ID: ${blockId}] ${message}`, data ? data : '');
}
