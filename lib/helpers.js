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
        if ((Number.MAX_SAFE_INTEGER - 1) === cc) {
            cc = 0;
        }
        return ++cc;
    };
};

module.exports = {
    counter
};