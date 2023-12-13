const {NotFound} = require('./errors');

/**
 * Init
 * @param {Object} init
 * @param {Object} init.config
 * @param {Symbol} init.config.tag
 * @returns {import('./types').Api}
 */
const Methods = ({
    config: {
        tag
    }
}) => {
    /** @constant @type {import('./types').methods} */
    const methods = new Map();

    /** @constant @type {import('./types').Api} */
    const api = {
        /**
         * Adds method to inventory
         * @param {import('./types').add} add
         * @returns {Function}
         */
        add: ({method, fn}) => (
            method && fn &&
                methods.set(method.join('.'),
                    (...args) => fn(...args))
        ),
        /**
         * Finds a method
         * @param {string[]} method
         * @returns {Function}
         */
        find: (method) => {
            const m = (method || []).join('.');
            if (!methods.has(m)) {
                throw NotFound.create(
                    'method: {method} not found',
                    {method: m, tag}
                );
            }
            return methods.get(m);
        },
        /**
         * Finds a method then tries to call it
         * @param {import('./types').call} call
         * @returns {Promise}
         */
        call: async({method, ctx}) =>
            api.find(method)(ctx)
    };

    return api;
};

module.exports = {Methods};
