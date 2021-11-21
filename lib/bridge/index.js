const Methods = require('../methods');
const Waiter = require('../waiter');
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

class Bridge {
    constructor({
        config: {
            waiter = {
                waitTime: 30000
            },
            id: bridgeId 
        } = {}
    } = {}) {
        this.config = {
            waiter
        };
        this.method = Methods();
        this.nodeId = Symbol(bridgeId || ++id);
        this.waiter = Waiter({
            nodeId: this.nodeId,
            config: this.config.waiter
        });
    }

    intersect({other}) {
        this.other = other;
    }

    async redirect({direction, packet, waiter} = {}) {
        if (direction === 'in') {
            (async() => {
                try {
                    const {meta: {idx, nodeId, ...meta}} = packet;
                    const {match} = waiter;
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
        return waiter;
    }

    async pass({direction, packet}) {
        const {match} = packet;
        const waiterFound = this.waiter.find(packet);
        packet = fillMeta(waiterFound, packet);
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
        if (!waiterFound) {
            const waiter = this.waiter.add({
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
                waiter,
                packet: {
                    ...packetNew,
                    meta: packetNew.meta && {
                        ...packetNew.meta,
                        idx: waiter.idx,
                        nodeId: waiter.nodeId
                    }
                }
            });
        }
        this.waiter.fulfill(waiterFound)(packetNew);
        return this.redirect({
            direction,
            packet: packetNew,
            waiter: waiterFound,
            match
        });
    }

    async destroy() {
        if (this.waiter) {
            this.waiter.destroy();
            this.waiter = null;
        }
    }
}

module.exports = Bridge;
