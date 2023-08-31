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
    log = ({level, payload}) => ({}),
    config: {
        packet: {
            waitTime = 1000000
        } = {},
        id
    } = {}
} = {}) => {
    const wire = Wire({
        log,
        config: {
            packet: {
                waitTime
            },
            id
        }
    });
    return {
        wire,
        wirePassFactory: ({
            payload,
            error,
            method,
            config,
            match = {}
        }) => {
            return wire.pass({
                packet: {
                    ...(payload && {payload: payload.concat([`>${method}`])}),
                    ...(error && {error}),
                    header: {
                        method
                    },
                    match,
                    config
                }
            });
        },
        methodRegisterFactory: ({
            name,
            fn
        }) => {
            wire.methods.add({
                method: name,
                fn: fn || (({payload, error}) => {
                    if (error) {
                        throw error;
                    }
                    return payload.concat([`X:${name}`]);
                })
            });
        }
    };
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
    timeOut,
    wireFactory,
    routerPassFactory
};
