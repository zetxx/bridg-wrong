const Method = require('./method');
const Request = require('./request');
const directions = {
    reversed: {
        in: 'out',
        out: 'in'
    }
};
let id = 0;

class Base {

    constructor({
        config: {
            request = {
                waitTime: 30000
            }
        } = {}
    } = {}) {
        this.config = {
            request
        };
        this.method = Method();
        this.nodeId = Symbol(++id);
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
        const methodCallResult = await (async() => {
            try {
                return {
                    payload: await this.method.call({
                            direction,
                            packet
                        })
                };
            } catch (error) {
                return {error, payload: undefined};
            }
        })();
        const packetNew = {
            ...packet,
            ...methodCallResult,
            match: undefined
        };
        if (!requestFound) {
            const request = this.requests.add(
                packetNew,
                match,
                (errorFullPacket) => {
                    return this.pass({
                        direction: directions.reversed[direction],
                        packet: {
                            ...packetNew,
                            ...errorFullPacket
                        }
                    })
                }
            );
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
}

module.exports = Base;
