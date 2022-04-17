const {NotFound} = require('./errors');

/**
 * method name should be in following pattern
 * method.direction
 * if real name of the method is 'a' and direction is 'in'
 * method name should be 'a.in' 
*/

module.exports = () => {
    const methods = new Map();
    const o = {
        add: ({method, fn}) => (
            method && fn &&
                methods.set(method,
                    (...args) => fn(...args))
        ),
        find: ({direction, packet = {}} = {}) => {
            const {
                meta: {
                    method: wantedMethod
                } = {}
            } = packet;
            const method = `${wantedMethod}.${direction}`;
            if (!methods.has(method)) {
                throw NotFound.create(
                    'method: {wantedMethod} not found',
                    {wantedMethod}
                );
            }
            return methods.get(method);
        },
        call: async({direction, packet}) =>
            o.find({direction, packet})(packet)
    };

    return o;
};