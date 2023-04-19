const {NotFound} = require('./errors');

module.exports = ({tag}) => {
    const methods = new Map();

    const o = {
        add: ({method, fn}) => (
            method && fn &&
                methods.set(method,
                    (...args) => fn(...args))
        ),
        find: (method) => {
            if (!methods.has(method)) {
                throw NotFound.create(
                    'method: {method} not found',
                    {method, tag}
                );
            }
            return methods.get(method);
        },
        call: async({method, ctx}) =>
            o.find(method)(ctx)
    };

    return o;
};
