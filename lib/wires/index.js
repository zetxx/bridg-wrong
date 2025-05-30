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
        async test(data) {
            return !!(await wires
                .reduce(async(a, test) => {
                    const aa = await a;
                    if (!aa) { // was some function already called
                        const f = await Promise.resolve(test(data));
                        if (f !== false) { // is correct function found
                            f && f(); // if result of the test is not falsie
                            return true;
                        }
                    }
                    return aa;
                }, false));
        },
        /**
         * write
         * @param {object} data
         * @returns {Promise<void>}
         */
        async write(data, notFound) {
            let satisfied = await this.test(data);
            if(!satisfied && notFound) { // no method found
                notFound(data);
            }
            return satisfied;
        }
    };
};

module.exports = Wires;
