const {NotFound} = require('./errors');

module.exports = () => {
    const methods = {};
    const o = {
        add: ({method, fn}) => {
            methods[method] = (...args) => fn(...args);
        },
        find: ({direction, packet = {}} = {}) => {
            const {
                meta: {
                    method: wantedMethod
                } = {}
            } = packet;
            const method = `${wantedMethod}.${direction}`;
            if (!methods[method]) {
                throw new NotFound(`method: ${wantedMethod} not found`);
            }
            return methods[method];
        },
        call: ({direction, packet}) => {
            return Promise.resolve(
                o.find({direction, packet})(packet)
            );
        }
    };

    return o;
};