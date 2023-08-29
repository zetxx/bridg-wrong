const {
    NotFound,
    WaitTimeExpired,
    ForceDestroy
} = require('./errors');

const Packet = ({waitTime, tag}) => ({
    match, // consist of target packet header that needs to be matched against
    config,
    header: {method, counter: idx, trace}
}) => {
    const packet = {
        header: {trace, idx, method, tag},
        match,
        config: {
            waitTime: config?.waitTime || waitTime
        },
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
        packet.state.reject({
            error: WaitTimeExpired.create(
                'WaitTimeExpired',
                {tag}
            )
        });
    }, packet.config.waitTime);
    return packet;
};

const Packets = ({
    config: {
        tag,
        waitTime = 30000
    } = {}
} = {}) => {
    let items = [];
    let counter = 0;
    const P = Packet({
        waitTime,
        tag
    });

    const o = {
        add({
            match,
            config,
            header: {
                method,
                trace
            } = {}
        }) {
            counter = counter + 1;
            const packet = P({
                match,
                config,
                header: {method, counter, trace}
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
        acquire({payload, header, match, config}) {
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
                            header,
                            config
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
            header: pH = {},
            match: pM = {}
        } = {}, cur) => ({
            payload: cur.payload,
            header: {
                ...pH,
                ...cur.header
            },
            match: {
                ...pM,
                ...cur.match
            }
        }), {header: {}, match: {}})
};
