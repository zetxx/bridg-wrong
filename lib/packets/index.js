const {
    NotFound,
    WaitTimeExpired,
    ForceDestroy
} = require('./errors');

/**
 * Packet
 * @param {Object} params
 * @param {import('./types').waitTime} params.waitTime
 * @param {import('./types').tag} params.tag
 * @returns {function}
 */
const Packet = ({waitTime, tag}) => {
    /**
     * Create Packet
     * @param {Object} params
     * @param {import('./types').match} params.match
     * @param {Object} params.config
     * @param {import('./types').waitTime} params.config.waitTime
     * @param {import('./types').header} params.header
     * @returns {import('./types').Packet}
     */
    const create = ({
       match,
       config,
       header: {method, idx, trace, match: hm}
   }) => {
       /** @constant @type {import('./types').Packet} */
       const packet = {
           header: {trace, idx, method, tag, match: hm},
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

   return create;
}

/**
 * Packet
 * @param {Object} params
 * @param {Object} params.config
 * @param {import('./types').waitTime} params.config.waitTime
 * @param {import('./types').tag} params.config.tag
 * @returns {import('./types').Api}
 */
const Packets = ({
    config: {
        tag,
        waitTime = 30000
    } = {}
} = {}) => {
    /** @constant @type {import('./types').Packet[]} */
    let items = [];
    let idx = 0;
    /** @constant @type {import('./types').Packet} */
    const P = Packet({
        waitTime,
        tag
    });

    /** @constant @type {import('./types').Api} */
    const packets = {
        add({
            config,
            header: {
                method,
                trace,
                match
            } = {}
        }) {
            idx = idx + 1;
            const packet = P({
                config,
                header: {
                    method,
                    idx,
                    trace: (trace && trace.concat(idx)) || [idx],
                    match
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
        acquire({payload, header, match, config}) {
            if (match && match.idx && match.tag) {
                const matched = packets.find(match);
                if (matched) {
                    return {
                        found: true,
                        matched: true,
                        packet: matched
                    };
                } else {
                    return packets.acquire({payload, header});
                }
            } else {
                const found = packets.find(header);
                if (!found) {
                    return {
                        packet: packets.add({
                            payload,
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
                    packets.fulfill(packet)({
                        error: ForceDestroy.create(
                            'ForceDestroy',
                            {tag}
                        )
                    }))
                );
        }
    };

    return packets;
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
