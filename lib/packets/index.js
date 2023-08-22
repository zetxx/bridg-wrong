const {
    NotFound,
    WaitTimeExpired,
    ForceDestroy
} = require('./errors');

const Packet = ({
    match, // consist of previous packet header that needs to be matched against
    header: {method, counter: idx, trace},
    config: {waitTime, tag}
}) => {
    const packet = {
        header: {trace, idx, method},
        match,
        config: {waitTime, tag},
        state: {
            resolve: undefined,
            reject: undefined,
            current: undefined
        }
    };
    packet.state.current = new Promise(
        (resolve, reject) => {
            packet.state.resolve = resolve;
            packet.state.reject = reject;
        }
    );
    packet.timeout = setTimeout(() => {
        packet.state.reject(WaitTimeExpired.create(
            'WaitTimeExpired',
            {tag}
        ));
    }, packet.config.waitTime);
    return packet;
};

const Packets = ({
    tag,
    config: {
        waitTime = 30000
    } = {}
} = {}) => {
    let items = [];
    let counter = 0;

    const o = {
        add({
            match,
            config = {},
            header: {
                method,
                trace
            } = {}
        }) {
            counter = counter + 1;
            const packet = Packet({
                match,
                header: {method, counter, trace},
                config: {
                    waitTime: config.waitTime || waitTime,
                    tag
                }
            });
            items.push(packet);
            return packet;
        },
        find({idx, tag: curtag = tag} = {}) {
            return items.find(({header: {idx: idxIn}}) => (
                idxIn === idx && tag === curtag
            ));
        },
        fulfill(packet) {
            const idx = items.findIndex((r) => r === packet);
            if (idx > -1) {
                items = items.slice(0, idx)
                    .concat(items.slice(idx + 1));

                return (payload = {}) => {
                    clearTimeout(packet.timeout);
                    if (payload.error) {
                        packet.state.reject(payload);
                    }
                    packet.state.resolve(payload);
                };
            } else {
                throw NotFound.create(
                    'PacketNotFound',
                    {tag}
                );
            }
        },
        len() {
            return items.length;
        },
        acquire({payload, header, match}) {
            if (match && match.idx && match.tag) {
                const matched = o.find(match);
                if (matched) {
                    return {
                        found: true,
                        matched: true,
                        packet: matched
                    };
                } else {
                    return o.acquire({payload, header});
                }
            } else {
                const found = o.find(header);
                if (!found) {
                    return {
                        packet: o.add({
                            payload,
                            match,
                            header
                        })
                    };
                }
                return {
                    found: true,
                    matched: false,
                    packet: found
                };
            }
        },
        destroy() {
            return items
                .map((packet) => (
                    o.fulfill(packet)({
                        error: ForceDestroy.create(
                            'ForceDestroy',
                            {tag}
                        )
                    }))
                );
        }
    };

    return o;
};

module.exports = {
    Packet,
    Packets,
    merge: (packets) => packets
        .reduce(({
            header: me1,
            match: ma1
        }, cur) => ({
            header: {
                ...me1,
                ...cur.header
            },
            match: {
                ...ma1,
                ...cur.match
            }
        }), {header: {}, match: {}})
};
