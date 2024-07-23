/**
 * @typedef {Object} AddValue
 * @property {import('../types.js').messageFn} fn
 */

const counter = () => {
    /**
     * @constant {number}
     */
    let cc = 0;
    /**
     * @returns {number}
     */
    return () => {
        /* c8 ignore start */
        if ((Number.MAX_SAFE_INTEGER - 1) === cc) {
            cc = 0;
        }
        /* c8 ignore stop */
        return ++cc;
    };
};

module.exports = {
    counter
};