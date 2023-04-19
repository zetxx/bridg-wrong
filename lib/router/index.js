const {RouterErrorWireNotFound} = require('./errors');

const defaultLog = (level, message) => {};

// two wire implementation
const Router = ({
    log = defaultLog,
    wires: [V0, V1]
} = {}) => {
    const wires = new Map();
    wires.set(V0.tag, V0);
    wires.set(V1.tag, V1);
    const findOpposite = (cur, collection) => {
        const all = collection || wires.keys();
        // dummy implementation
        let v = all.next();
        if (v.value !== cur) {
            return wires.get(v.value);
        }
        return findOpposite(cur, all);
    };

    const pass = async({wire, packet}) => {
        const first = wires.get(wire);
        if (!first) {
            throw RouterErrorWireNotFound(
                {wire}
            );
        }
        const second = findOpposite(wire);
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

        const spp = await secondPacket.packet.promise;
        // third call with in order to create response
        await first.pass({
            packet: {
                payload: spp.packet.payload,
                match: {
                    idx: firstPacket.packet.idx,
                    tag: firstPacket.packet.tag
                },
                meta: {
                    trace: firstPacket.meta.trace
                }
            }
        });
        return await firstPacket.packet.promise;
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
