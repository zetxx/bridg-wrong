const {
    NotFound,
    WaitTimeExpired,
    ForceDestroy
} = require('./errors');

const createPacket = ({
    timeout,
    match,
    method,
    direction,
    config = {},
    counter,
    tag,
    trace,
    waitTime
}) => {
    const packet = {
        tag,
        trace,
        idx: counter,
        // consist of previous packet meta that needs to be matched against
        match,
        method,
        direction,
        config: {
            waitTime: config.waitTime || waitTime
        }
    };
    packet.promise = new Promise(
        (resolve, reject) => {
            packet.resolve = resolve;
            packet.reject = reject;
        }
    );
    packet.timeout = setTimeout(() => {
        timeout({
            error: WaitTimeExpired.create(
                'WaitTimeExpired',
                {tag}
            ),
            meta: {
                idx: packet.idx,
                tag,
                direction,
                match,
                method
            }
        });
    }, packet.config.waitTime);
    return packet;
};

const Packet = ({
    tag,
    config: {
        waitTime = 30000
    } = {}
} = {}) => {
    let items = [];
    let counter = 0;

    const o = {
        destroy() {
            return items.map((packet) =>
                o.fulfill(packet)({
                    error: ForceDestroy.create(
                        'ForceDestroy',
                        {tag}
                    )
                }));
        },
        add({
            packet: {
                match,
                meta: {
                    method,
                    direction,
                    config,
                    trace
                } = {}
            } = {},
            timeout
        }) {
            counter = counter + 1;
            const packet = createPacket({
                timeout,
                match,
                method,
                direction,
                config,
                counter,
                trace,
                tag,
                waitTime
            });
            items.push(packet);
            return packet;
        },
        find({idx, tag: curtag = tag} = {}) {
            return items.find(({idx: idxIn}) => (
                idxIn === idx &&
                tag === curtag
            ));
        },
        fulfill(packet) {
            const idx = items.findIndex((r) => r === packet);
            if (idx > -1) {
                items = items.slice(0, idx)
                    .concat(items.slice(idx + 1));

                return (pkg = {}) => {
                    clearTimeout(packet.timeout);
                    if (pkg.error) {
                        packet.reject(pkg);
                    }
                    packet.resolve(pkg);
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
        }
    };

    return o;
};

module.exports = Packet;
