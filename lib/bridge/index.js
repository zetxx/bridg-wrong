const Methods = require('../methods');
const Waiters = require('../waiters');
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
    context: {nodeId}
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
            {nodeId}
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
    const nodeId = Symbol(bridgeId || ++id);
    const waiters = Waiters({
        nodeId: nodeId,
        config: config.request
    });
    let other = null;

    const redirect = async({direction, packet, request} = {}) => {
        if (direction === 'in') {
            (async() => {
                try {
                    const {meta: {idx, nodeId, ...meta}} = packet;
                    const {match} = request;
                    if (match && match.idx && match.nodeId) {
                        meta.idx = match.idx;
                        meta.nodeId = match.nodeId;
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
        const requestFound = waiters.find(packet);
        packet = fillMeta(requestFound, packet);
        const methodCallResult = await callMethod({
            methods: methods,
            context: {nodeId: nodeId}
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
            const request = waiters.add({
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
                        nodeId: request.nodeId
                    }
                }
            });
        }
        waiters.fulfill(requestFound)(packetNew);
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
        waiters,
        intersect({other: otherPart}) {
            other = otherPart;
        },
        destroy() {
            if (waiters){
                waiters.destroy();
            }
        }
    };
};

class B {
    constructor({
        config: {
            request = {
                waitTime: 30000
            },
            id: bridgeId 
        } = {}
    } = {}) {
        this.config = {
            request
        };
        this.method = Methods();
        this.nodeId = Symbol(bridgeId || ++id);
        this.request = Waiters({
            nodeId: this.nodeId,
            config: this.config.request
        });
    }

    intersect({other}) {
        this.other = other;
    }

    async redirect({direction, packet, request} = {}) {
        if (direction === 'in') {
            (async() => {
                try {
                    const {meta: {idx, nodeId, ...meta}} = packet;
                    const {match} = request;
                    if (match && match.idx && match.nodeId) {
                        meta.idx = match.idx;
                        meta.nodeId = match.nodeId;
                    }
                    const o1 = await this.other?.pass?.({
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
    }

    async pass({direction, packet: {...packet}}) {
        const {match} = packet;
        const requestFound = this.request.find(packet);
        packet = fillMeta(requestFound, packet);
        const methodCallResult = await callMethod({
            methods: this.method,
            context: {nodeId: this.nodeId}
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
            const request = this.request.add({
                packet: packetNew,
                match,
                onLocalReject: (errorFullPacket) => {
                    return this.pass({
                        direction: directions.reversed[direction],
                        packet: {
                            ...packetNew,
                            ...errorFullPacket
                        }
                    })
                }
            });
            return this.redirect({
                direction,
                request,
                packet: {
                    ...packetNew,
                    meta: packetNew.meta && {
                        ...packetNew.meta,
                        idx: request.idx,
                        nodeId: request.nodeId
                    }
                }
            });
        }
        this.request.fulfill(requestFound)(packetNew);
        return this.redirect({
            direction,
            packet: packetNew,
            request: requestFound,
            match
        });
    }

    async destroy() {
        if (this.request) {
            this.request.destroy();
            this.request = null;
        }
    }
}

module.exports = Bridge;
