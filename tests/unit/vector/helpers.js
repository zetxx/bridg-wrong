const Vector = require('../../../lib/vector');

const timeOut = (cb, time) => new Promise(
    (resolve, reject) =>
        setTimeout(
            async () => {
                resolve(await cb());
            },
            time
        )
);

const vectorFactory = ({
    log = (level, msg) => console[level](msg),
    config: {
        request: {
            waitTime = 1000000
        } = {},
        id
    } = {}
} = {}) => Vector({
    log,
    config: {
        request: {
            waitTime
        },
        id
    }
});

const methodRegisterFactory = (vector, name) => {
    vector.methods.add({
        method: name,
        fn: ({payload, error}) => {
            if (error) {
                throw error;
            }
            return payload.concat([`X:${name}`]);
        }
    });
};

const passFactory = (
    vector,
    payload,
    error,
    m,
    match = {}
) => {
    const [method, direction] = m.split('.');
    return vector.pass({
        packet: {
            ...(payload && {payload: payload.concat([`>${m}`])}),
            ...(error && {error}),
            meta: {
                direction,
                method
            },
            match
        }
    });
};

module.exports = {
    methodRegisterFactory,
    timeOut,
    vectorFactory,
    passFactory
};
