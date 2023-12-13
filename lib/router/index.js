const Router = ({
    config,
    wires: w
}) => {
    const wires = w;

    const findOther = (wire) => {
        return wires.find((ww) => ww !== wire);
    };

    const final = async({wire}) => {
        wire.methods.add({
            method: ['*', 'in'],
            fn: async(packet) => {
                let match = {};
                let prevMatch = {};
                const [m, d] = packet.header.method;
                const otherSide = findOther(wire);

                if (packet.header.match) {
                    match = {
                        ...packet.header.match,
                        tag: otherSide.tag
                    };
                } else {
                    prevMatch = {
                        ...packet.header,
                        tag: undefined
                    };
                }
                otherSide.pass({packet: {
                    ...packet,
                    header: {
                        ...packet.header,
                        idx: undefined,
                        method: [m, {in: 'out', out: 'in'}[d]],
                        match: prevMatch
                    },
                    match
                }});
            }
        });
    };

    return {
        async start() {
            return await Promise.all(
                wires.map(async(wire, idx) => {
                    await wire.start();
                    final({wire});
                })
            );
        }
    };
};

module.exports = Router;
