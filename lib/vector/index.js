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

    const callSpecMethod = async(ctx) => {
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
                        onLocalReject: (errorFullPacket) => {
                            throw new Error('what todo?');
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

    const pass = async({
        packet: {
            payload,
            error,
            meta: {...meta} = {},
            match: {...match} = {}
        }
    }) => {
        const acquired = acquireRequest({
            payload,
            meta,
            match
        });
        const methodCallResult = await callMethod({
            payload,
            error,
            meta,
            match
        });
        if (acquired.matched) {
            requests.fulfill(acquired.request)({
                packet: {
                    ...methodCallResult,
                    ...mergePackets([
                        {meta, match},
                        methodCallResult
                    ])
                }
            });
        }

        const fin = {
            ...methodCallResult,
            request: acquired.request,
            ...mergePackets([
                {meta, match},
                methodCallResult
            ])
        };
        return await callSpecMethod(fin);
    };

    return {
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
        }
    };
};

module.exports = Vector;
