const {NotFound} = require('./errors');

/**
 * method name should be in following pattern
 * method.direction
 * if real name of the method is 'a' and direction is 'in'
 * method name should be 'a.in' 
*/

module.exports = ({tag}) => {
    const methods = new Map();

    const o = {
        add: ({method, fn}) => (
            method && fn &&
                methods.set(method,
                    (...args) => fn(...args))
        ),
        find: ({packet = {}} = {}) => {
            const {
                meta: {
                    direction,
                    method: wantedMethod
                } = {}
            } = packet;
            const method = `${wantedMethod}.${direction}`;
            if (!methods.has(method)) {
                throw NotFound.create(
                    'method: {method} not found',
                    {method, tag}
                );
            }
            return methods.get(method);
        },
        call: async({packet}) =>
            o.find({packet})(packet)
    };

    return o;
};