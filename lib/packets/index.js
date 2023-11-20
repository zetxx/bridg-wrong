const {
    NotFound,
    WaitTimeExpired,
    ForceDestroy
} = require('./errors');

/**
 * Description
 * @param {Object} params
 * @param {import('./types').waitTime} params.waitTime
 * @param {import('./types').tag} params.tag
 * @returns {import('./types').Packet}
 */
const Packet = ({waitTime, tag}) => {
    const create = ({
       match,
       config,
       header: {method, idx, trace, match: hm}
   }) => {
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

const Packets = ({
    config: {
        tag,
        waitTime = 30000
    } = {}
} = {}) => {
    let items = [];
    let idx = 0;
    const P = Packet({
        waitTime,
        tag
    });

    const inventory = {
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
                const matched = inventory.find(match);
                if (matched) {
                    return {
                        found: true,
                        matched: true,
                        packet: matched
                    };
                } else {
                    return inventory.acquire({payload, header});
                }
            } else {
                const found = inventory.find(header);
                if (!found) {
                    return {
                        packet: inventory.add({
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
                    inventory.fulfill(packet)({
                        error: ForceDestroy.create(
                            'ForceDestroy',
                            {tag}
                        )
                    }))
                );
        }
    };

    return inventory;
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
