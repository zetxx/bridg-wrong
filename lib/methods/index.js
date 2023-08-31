const {NotFound} = require('./errors');

const Methods = ({tag}) => {
    const methods = new Map();

    const o = {
        add: ({method, fn}) => (
            method && fn &&
                methods.set(method.join('.'),
                    (...args) => fn(...args))
        ),
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
        call: async({method, ctx}) =>
            o.find(method)(ctx)
    };

    return o;
};

module.exports = {Methods};
