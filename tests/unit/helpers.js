const Wire = require('../../lib/wire');

const timeOut = (cb, time) => new Promise(
    (resolve, reject) =>
        setTimeout(
            async() => {
                resolve(await cb());
            },
            time
        )
);

const wireFactory = ({
    log = (level, msg) => console[level](msg),
    config: {
        packet: {
            waitTime = 1000000
        } = {},
        id
    } = {}
} = {}) => Wire({
    log,
    config: {
        packet: {
            waitTime
        },
        id
    }
});

const methodRegisterFactory = (
    wire,
    name,
    fn
) => {
    wire.methods.add({
        method: name,
        fn: fn || (({payload, error}) => {
            if (error) {
                throw error;
            }
            return payload.concat([`X:${name}`]);
        })
    });
};

const wirePassFactory = (
    wire,
    payload,
    error,
    [method],
    match = {}
) => {
    return wire.pass({
        packet: {
            ...(payload && {payload: payload.concat([`>${method}`])}),
            ...(error && {error}),
            header: {
                method
            },
            match
        }
    });
};

const routerPassFactory = (
    router,
    payload,
    error,
    [method],
    match = {}
) => {
    return router.pass({
        packet: {
            ...(payload && {payload: payload.concat([`>${method}`])}),
            ...(error && {error}),
            header: {
                method
            },
            match
        }
    });
};

module.exports = {
    methodRegisterFactory,
    timeOut,
    wireFactory,
    wirePassFactory,
    routerPassFactory
};
