/**
 * Wires bootstrap
 * @returns {import('./types').Api}
 */
const Wires = () => {
    /** @constant {import('./types').register[]} */
    const wires = [];

    return {
        /**
         * test
         * @param {import('../types').messageFn} test
         * @returns {void}
         */
        register(fn) {
            wires.push(fn);
        },
        /**
         * write
         * @param {object} data
         * @returns {void}
         */
        write(data) {
            wires
                .reduce(async(a, test) => {
                    const aa = await a;
                    if (!aa) { // was some function already called
                        const f = await Promise.resolve(test(data));
                        if (f) { // is correct function found
                            f();
                            return true;
                        }
                    }
                    return aa;
                }, false);
        }
    };
};

module.exports = Wires;
