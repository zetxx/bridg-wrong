const {Methods} = require('../methods');
const {Packets, merge: mergePackets} = require('../packets');
const {WireMultiError} = require('./errors');

/** @constant @type {number} */
let tagId = 0;

/**
 * Wire
 * @param {function} log
 * @param {object} config
 * @param {any} config.id
 * @param {object} config.restConfig
 * @returns {import('./types').}
 */
const Wire = ({
    log,
    config: {
        id,
        ...restConfig
    } = {}
} = {}) => {
    /** @constant @type {Symbol} */
    const tag = Symbol(id || ++tagId);
    /** @constant @type {import('../methods/types').methods} */
    const methods = Methods({
        config: {
            ...restConfig,
            tag
        },
        log
    });
    const packets = Packets({
        config: {
            ...restConfig,
            tag
        },
        log
    });
    const callMethod = async({
        payload,
        error,
        header,
        match,
        final
    }) => {
        const ctx = {
            payload,
            error,
            header,
            match
        };
        try {
            const mfc = (final && ['*'].concat(ctx.header.method.slice(-1))) ||
                ctx.header.method;
            log({level: 'trace', payload: {tag, mfc}});
            return {
                error: undefined,
                payload: await methods.call({
                    method: mfc,
                    ctx
                })
            };
        } catch (e) {
            if (error && error !== e) {
                return {
                    error: WireMultiError.errorFromList([
                        error,
                        e
                    ]),
                    payload: undefined
                };
            }
            return {
                error: e,
                payload: undefined
            };
        }
    };

    const last = async(ctx) => {
        return await callMethod({
            ...ctx,
            final: true
        });
    };

    const pass = ({
        packet: {
            payload,
            error,
            ctx = {},
            header = {},
            match = {},
            config: {
                packet: packetCfg = {}
            } = {}
        }
    }) => {
        const acquired = packets.acquire({
            payload,
            header,
            match,
            config: packetCfg
        });
        // make sure that this piece of code executes after
        // pass fn returns acquired packet
        setTimeout(async() => {
            const method = header.method || acquired.packet.header.method;
            const methodCallResult = await callMethod({
                payload,
                error,
                header: {
                    ...acquired.packet.header,
                    method
                },
                match,
                ctx
            });
            const fin = {
                ...methodCallResult,
                ...mergePackets([
                    {
                        header: {
                            ...acquired.packet.header,
                            method
                        },
                        match: acquired.packet.match
                    },
                    methodCallResult
                ])
            };
            const finRes = await last(fin);
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
            return Wire;
        },
        destroy() {
            if (packets) {
                packets.destroy();
            }
        }
    };
};

module.exports = Wire;
