const {
    NotFound,
    WaitTimeExpired,
    ForceDestroy
} = require('./errors');

const Packet = ({
    match, // consist of previous packet headers that needs to be matched against
    headers: {method, direction, counter: idx, trace},
    config: {waitTime, tag}
}) => {
    const packet = {
        headers: {trace, idx, method, direction},
        match,
        config: {waitTime, tag}
    };
    packet.promise = new Promise(
        (resolve, reject) => {
            packet.resolve = resolve;
            packet.reject = reject;
        }
    );
    packet.timeout = setTimeout(() => {
        packet.reject(WaitTimeExpired.create(
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
            headers: {
                method,
                direction,
                trace
            } = {}
        }) {
            counter = counter + 1;
            const packet = Packet({
                match,
                headers: {method, direction, counter, trace},
                config: {
                    waitTime: config.waitTime || waitTime,
                    tag
                }
            });
            items.push(packet);
            return packet;
        },
        find({idx, tag: curtag = tag} = {}) {
            return items.find(({headers: {idx: idxIn}}) => (
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
                        packet.reject(payload);
                    }
                    packet.resolve(payload);
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
        destroy() {
            return items.map((packet) =>
                o.fulfill(packet)({
                    error: ForceDestroy.create(
                        'ForceDestroy',
                        {tag}
                    )
                }));
        }
    };

    return o;
};

module.exports = Packets;
