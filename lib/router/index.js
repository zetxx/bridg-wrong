const Methods = require('../methods');
const Requests = require('../requests');
const {RouterError, RouterMultiError} = require('./errors');

const directions = {
    reversed: {
        in: 'out',
        out: 'in'
    }
};
let id = 0;

const callMethod = ({
    methods,
    context: {tag}
}) => async({
    packet
}) => {
    try {
        return {
            payload: await methods.call({
                    packet
                })
        };
    } catch (error) {
        if (packet.error) {
            return {
                error: RouterMultiError.errorFromList([
                    packet.error,
                    error
                ]),
                payload: undefined
            };
        }
        return {
            error,
            payload: undefined
        };
    }
};

const fillMeta = (
    {method} = {},
    packet = {}
) => {
    if (method && !(packet.meta?.method)) {
        return {
            ...packet,
            meta: {
                ...packet.meta,
                method
            }
        };
    }
    return packet;
};

const defaultLog = (level, message) => {};

const Router = ({
    log = defaultLog,
    directionHooks = {}, // in, out functions
    config: {
        request = {
            waitTime: 30000
        },
        id: routerId 
    } = {}
} = {}) => {
    const config = {
        request
    };
    const tag = Symbol(routerId || ++id);
    const methods = Methods({tag, log});
    const requests = Requests({
        tag,
        config: config.request,
        log
    });
    let other = null;

    const redirect = async({packet, request} = {}) => {
        if (packet.meta.direction === 'in') {
            (async() => {
                try {
                    const {meta: {idx, tag, ...meta}} = packet;
                    const {match} = request;
                    if (match && match.idx && match.tag) {
                        meta.idx = match.idx;
                        meta.tag = match.tag;
                    }
                    meta.direction = 'out';
                    const o1 = await other?.pass?.({
                        packet: {
                            ...packet,
                            meta,
                            match: packet.meta
                        }
                    });
                    o1 && (await o1?.promise);
                } catch (e) {
                    log('error', e);
                }
            })();
        }
        return request;
    };
    const asyncHook = async(packet) => {
        const {meta} = packet;
        if (meta.direction in directionHooks) {
            return (async(args) => directionHooks[meta.direction](args))(packet);
        }
        return packet;
    };
    const pass = async(p) => {
        let {packet: {...packet}} = p;
        const {match, meta} = packet;
        const requestFound = requests.find(packet);
        if (
            requestFound &&
            requestFound.idx === meta.idx &&
            requestFound.direction === meta.direction
        ) {
            requests.fulfill(requestFound)(packet);
            return redirect({
                packet,
                request: requestFound,
                match
            });
        }
        // request is expired and not found in request queue
        if (!requestFound && meta.idx) {
            log('warn', 'requestExpired');
            return Promise.resolve({});
        }
        packet = fillMeta(requestFound, packet);
        const methodCallResult = await callMethod({
            methods: methods,
            context: {tag: tag}
        })({
            packet
        });
        const packetNew = {
            ...packet,
            ...methodCallResult,
            match: undefined
        };
        if (!requestFound) {
            if (meta.direction === 'stop') {
                return ;
            }
            const request = requests.add({
                packet: packetNew,
                match,
                onLocalReject: (errorFullPacket) => {
                    return pass({
                        packet: {
                            ...packetNew,
                            ...errorFullPacket
                        }
                    })
                }
            });
            const asyncHookPacket = await asyncHook({
                ...packetNew,
                meta: {
                    ...(packetNew.meta || {}),
                    idx: request.idx,
                    tag: request.tag
                }
            });
            return redirect({
                request,
                packet: asyncHookPacket
            });
        }
        if (meta.direction === 'stop') {
            requests.fulfill(requestFound)(packetNew);
            return ;
        }
        const asyncHookPacket = await asyncHook(packetNew);
        requests.fulfill(requestFound)(asyncHookPacket);
        return redirect({
            packet: asyncHookPacket,
            request: requestFound,
            match
        });
    };

    return {
        log,
        methods,
        pass,
        requests: requests,
        intersect({other: otherPart}) {
            other = otherPart;
        },
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

module.exports = Router;
