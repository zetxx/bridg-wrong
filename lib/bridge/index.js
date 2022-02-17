const Methods = require('../methods');
const Requests = require('../requests');
const {BridgeError, BridgeMultiError} = require('./errors');

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
    direction,
    packet
}) => {
    try {
        return {
            payload: await methods.call({
                    direction,
                    packet
                })
        };
    } catch (error) {
        const localError = BridgeError.wrap(
            'Method call',
            error,
            {tag}
        );
        if (packet.error) {
            return {
                error: BridgeMultiError.errorFromList([
                    packet.error,
                    localError
                ]),
                payload: undefined
            };
        }
        return {
            error: localError,
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

const Bridge = ({
    config: {
        request = {
            waitTime: 30000
        },
        id: bridgeId 
    } = {}
} = {}) => {
    const config = {
        request
    };
    const methods = Methods();
    const tag = Symbol(bridgeId || ++id);
    const requests = Requests({
        tag: tag,
        config: config.request
    });
    let other = null;

    const redirect = async({direction, packet, request} = {}) => {
        if (direction === 'in') {
            (async() => {
                try {
                    const {meta: {idx, tag, ...meta}} = packet;
                    const {match} = request;
                    if (match && match.idx && match.tag) {
                        meta.idx = match.idx;
                        meta.tag = match.tag;
                    }
                    const o1 = await other?.pass?.({
                        direction: directions.reversed[direction],
                        packet: {
                            ...packet,
                            meta,
                            match: packet.meta
                        }
                    });
                    o1 && await o1?.promise;
                } catch (e) {
                    console.error(e);
                }
            })();
        }
        return request;
    };

    const pass = async({direction, packet: {...packet}}) => {
        const {match} = packet;
        const requestFound = requests.find(packet);
        packet = fillMeta(requestFound, packet);
        const methodCallResult = await callMethod({
            methods: methods,
            context: {tag: tag}
        })({
            direction,
            packet
        });
        // @TODO do something when method not found
        const packetNew = {
            ...packet,
            ...methodCallResult,
            match: undefined
        };
        if (!requestFound) {
            const request = requests.add({
                packet: packetNew,
                match,
                onLocalReject: (errorFullPacket) => {
                    return pass({
                        direction: directions.reversed[direction],
                        packet: {
                            ...packetNew,
                            ...errorFullPacket
                        }
                    })
                }
            });
            return redirect({
                direction,
                request,
                packet: {
                    ...packetNew,
                    meta: packetNew.meta && {
                        ...packetNew.meta,
                        idx: request.idx,
                        tag: request.tag
                    }
                }
            });
        }
        requests.fulfill(requestFound)(packetNew);
        return redirect({
            direction,
            packet: packetNew,
            request: requestFound,
            match
        });
    };

    return {
        methods,
        pass,
        requests: requests,
        intersect({other: otherPart}) {
            other = otherPart;
        },
        destroy() {
            if (requests){
                requests.destroy();
            }
        }
    };
};

module.exports = Bridge;
