const Methods = require('../methods');
const Requests = require('../requests');
const {RouterErrorVectorNotFound, RouterMultiError} = require('./errors');

const defaultLog = (level, message) => {};

// two vector implementation
const Router = ({
    log = defaultLog,
    vectors: [V0, V1]
} = {}) => {
    const vectors = new Map();
    vectors.set(V0.tag, V0);
    vectors.set(V1.tag, V1);
    const findOpposite = (cur, collection) => {
        const all = collection || vectors.keys();
        // dummy implementation
        let v = all.next();
        if (v.value !== cur) {
            return vectors.get(v.value);
        }
        return findOpposite(cur, all);
    };

    const pass = async({vector, packet}) => {
        const first = vectors.get(vector);
        if(!first) {
            throw RouterErrorVectorNotFound(
                {vector}
            );
        }
        const second = findOpposite(vector);
        const firstPacket = await first.pass({
            packet: {
                ...packet,
                meta: {
                    ...packet.meta,
                    direction: 'in'
                }
            }
        });
        const secondPacket = await second.pass({
            packet: {
                payload: firstPacket.payload,
                meta: {
                    method: firstPacket.meta.method,
                    direction: 'out',
                    trace: firstPacket.meta.trace
                }
            }
        });

        const spp = await secondPacket.request.promise;
        // third call with in order to create response
        await first.pass({
            packet: {
                payload: spp.packet.payload,
                match: {
                    idx: firstPacket.request.idx,
                    tag: firstPacket.request.tag
                },
                meta: {
                    trace: firstPacket.meta.trace
                }
            }
        });
        return await firstPacket.request.promise;
    };
    const rtr = {
        log,
        pass
    };
    V0.ctx({router: rtr});
    V1.ctx({router: rtr});
    return rtr;
};

module.exports = Router;
