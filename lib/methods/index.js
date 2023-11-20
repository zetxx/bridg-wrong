const {NotFound} = require('./errors');

/**
 * Init
 * @param {Object} init
 * @param {Symbol} init.tag
 * @returns {import('./types').Api}
 */
const Methods = ({tag}) => {
    /** @constant @type {Map<String, import('./types').method>} */
    const methods = new Map();

    /** @constant @type {import('./types').Api} */
    const api = {
        /**
         * Adds method to inventory
         * @param {import('./types').add} add
         * @returns {import('./types').method}
         */
        add: ({method, fn}) => (
            method && fn &&
                methods.set(method.join('.'),
                    (...args) => fn(...args))
        ),
        /**
         * Finds a method
         * @param {string[]} method
         * @returns {import('./types').method}
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
