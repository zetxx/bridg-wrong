const Methods = require('../methods');
const Packets = require('../packets');
const {WireMultiError} = require('./errors');
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

const Wire = ({
    log,
    config: {
        packet = {
            waitTime: 30000
        },
        id
    } = {}
} = {}) => {
    const config = {
        packet
    };
    const tag = Symbol(id || ++countId);
    const methods = Methods({tag, log});
    const packets = Packets({
        tag,
        config: config.packet,
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
                    error: WireMultiError.errorFromList([
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

    const acquirePacket = ({payload, headers, match}) => {
        if (match && match.idx && match.tag) {
            const matched = packets.find(match);
            if (matched) {
                return {
                    found: true,
                    matched: true,
                    packet: matched
                };
            } else {
                return acquirePacket({payload, headers});
            }
        } else {
            const found = packets.find(headers);
            if (!found) {
                return {
                    packet: packets.add({
                        payload,
                        match,
                        headers
                    })
                };
            }
            return {
                found: true,
                matched: false,
                packet: found
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
        const acquired = acquirePacket({
            payload,
            headers: meta,
            match
        });
        // make sure that this piece of code executes after
        // pass fn returns acquired packet
        setTimeout(async() => {
            const methodCallResult = await callMethod({
                payload,
                error,
                meta: {
                    method: acquired.packet.method,
                    trace: acquired.packet.headers.trace,
                    direction: addDirection(acquired.packet.headers.direction),
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
                packet: acquired.packet
            });
            if (acquired.matched || finRes.error) {
                packets.fulfill(acquired.packet)({
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
        packets,
        async start() {
            return 'done';
        },
        destroy() {
            if (packets) {
                packets.destroy();
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

module.exports = Wire;
