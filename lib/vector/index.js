const Methods = require('../methods');
const Requests = require('../requests');
const {RouterError, VectorMultiError} = require('./errors');
let countId = 0;

const mergePackets = (packets) => packets.reduce(({
    meta: me1,
    match: ma1
}, cur) => ({
    meta: {
        ...me1,
        ...cur.meta
    },
    match: {
        ...ma1,
        ...cur.match
    }
}), {meta: {}, match: {}});

const Vector = ({
    log,
    config: {
        request = {
            waitTime: 30000
        },
        id
    } = {}
} = {}) => {
    const config = {
        request
    };
    const tag = Symbol(id || ++countId);
    const methods = Methods({tag, log});
    const requests = Requests({
        tag,
        config: config.request,
        log
    });

    let globalCtx = {};

    const callMethod = async({
        payload,
        error,
        meta,
        match
    }) => {
        const ctx = {
            payload,
            error,
            meta,
            match
        };
        try {
            return {
                payload: await methods.call({
                        method: [
                            ctx.meta.method,
                            ctx.meta.direction
                        ].join('.'),
                        ctx
                    })
            };
        } catch (error) {
            if (ctx.error) {
                return {
                    ...ctx,
                    error: VectorMultiError.errorFromList([
                        ctx.error,
                        error
                    ]),
                    payload: undefined
                };
            }
            return {
                ...ctx,
                error,
                payload: undefined
            };
        }
    };

    const last = async(ctx) => {
        if (ctx.error) {
            return ctx;
        }
        try {
            const r = await methods.call({
                method: [
                    '*',
                    ctx.meta.direction
                ].join('.'),
                ctx
            });
            if (!r) {
                return ctx;
            } else {
                return r;
            }
        } catch (e) {
            if (e.name === 'MethodNotFound') {
                return ctx;
            }
            throw e;
        }
    };

    const acquireRequest = ({payload, meta, match}) => {
        if (match && match.idx && match.tag) {
            const matched = requests.find(match);
            if (matched) {
                return {
                    found: true,
                    matched: true,
                    request: matched
                };
            } else {
                return acquireRequest({payload, meta});
            }
        } else {
            const found = requests.find(meta);
            if (!found) {
                return {
                    request: requests.add({
                        packet: {
                            payload,
                            match,
                            meta
                        },
                        timeout: (errorFullPacket) => {
                            log('error', errorFullPacket);
                            throw new Error('what to do?');
                        }
                    })
                };
            }
            return {
                found: true,
                matched: false,
                request: found
            };
        }
    };

    const addDirection = (direction) => (
        (direction === 'out' && 'out') || 'in'
    );

    const pass = ({
        packet: {
            payload,
            error,
            ctx = {},
            meta: {...meta} = {},
            match: {...match} = {}
        }
    }) => {
        const acquired = acquireRequest({
            payload,
            meta,
            match
        });
        // make sure that this piece of code executes after
        // pass fn returns acquired request
        setTimeout(async() => {
            const methodCallResult = await callMethod({
                payload,
                error,
                meta: {
                    method: acquired.request.method,
                    trace: acquired.request.trace,
                    direction: addDirection(acquired.request.direction),
                    ...meta
                },
                match,
                ctx: {
                    ...globalCtx,
                    ...ctx
                }
            });
            const fin = {
                ...methodCallResult,
                ...mergePackets([
                    {meta, match},
                    methodCallResult
                ])
            };
            const finRes = await last({
                ...fin,
                request: acquired.request
            });
            if (acquired.matched || finRes.error) {
                requests.fulfill(acquired.request)({
                    ...fin,
                    ...finRes
                });
            }
        }, 1);
        return acquired;
    };

    return {
        tag,
        pass,
        methods,
        requests: requests,
        async start() {
            return 'done';
        },
        destroy() {
            if (requests){
                requests.destroy();
            }
        },
        ctx(value) {
            if (value) {
                globalCtx = {
                    ...globalCtx,
                    ...value
                };
            }
            return globalCtx; 
        }
    };
};

module.exports = Vector;
