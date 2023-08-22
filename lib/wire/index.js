const {Methods} = require('../methods');
const {Packets, merge: mergePackets} = require('../packets');
const {WireMultiError} = require('./errors');
let countId = 0;

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

    const globalCtx = {};

    const ctxMerge = (localCtx) => {
        if (localCtx) {
            return {
                ...globalCtx,
                ...localCtx
            };
        }
        return globalCtx;
    };

    const callMethod = async({
        payload,
        error,
        header,
        match
    }) => {
        const ctx = {
            payload,
            error,
            header,
            match
        };
        try {
            return {
                payload: await methods.call({
                    method: [
                        ctx.header.method
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
        const r = await callMethod({ctx, header: {method: '*'}});
        if (r.error) {
            // suppress error if last method is not defined
            if (r.error.name === 'MethodNotFound') {
                return ctx;
            }
            throw r.error;
        }
        if (!r) {
            return ctx;
        } else {
            return r;
        }
    };

    const pass = ({
        packet: {
            payload,
            error,
            ctx = {},
            header: {...header} = {},
            match: {...match} = {}
        }
    }) => {
        const acquired = packets.acquire({
            payload,
            header,
            match
        });
        // make sure that this piece of code executes after
        // pass fn returns acquired packet
        setTimeout(async() => {
            const methodCallResult = await callMethod({
                payload,
                error,
                header: {
                    method: acquired.packet.method,
                    trace: acquired.packet.header.trace,
                    ...header
                },
                match,
                ctx: ctxMerge(ctx)
            });
            const fin = {
                ...methodCallResult,
                ...mergePackets([
                    {header, match},
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
        ctxMerge
    };
};

module.exports = Wire;
