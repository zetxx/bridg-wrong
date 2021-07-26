const Methods = require('../methods');
const Request = require('../requests');
const directions = {
    reversed: {
        in: 'out',
        out: 'in'
    }
};
let id = 0;

const callMethod = (methods) => async({
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
        return {error, payload: undefined};
    }
};

class Bridge {
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
        this.methods = Methods();
        this.nodeId = Symbol(bridgeId || ++id);
        this.requests = Request({
            nodeId: this.nodeId,
            config: this.config.request
        });
    }

    async start({other}) {
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

    async pass({direction, packet}) {
        const {match} = packet;
        const requestFound = this.requests.find(packet);
        const methodCallResult = await callMethod(this.methods)({
            direction,
            packet
        });
        const packetNew = {
            ...packet,
            ...methodCallResult,
            match: undefined
        };
        if (!requestFound) {
            const request = this.requests.add({
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
        this.requests.fulfill(requestFound)(packetNew);
        return this.redirect({
            direction,
            packet: packetNew,
            request: requestFound,
            match
        });
    }

    async destroy() {
        this.requests.destroy();
    }
}

module.exports = Bridge;
