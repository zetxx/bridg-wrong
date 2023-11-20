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
        packet: {
            waitTime = 30000
        } = {},
        tag
    } = {}
} = {}) => {
    /** @constant @type {import('./types').Packet[]} */
    let items = [];
    /** @constant @type {number} */
    let idx = 0;
    /** @constant @type {function} */
    const P = Packet({
        waitTime,
        tag
    });

    /** @constant @type {import('./types').Api} */
    const Api = {
        /**
         * add
         * @param {Object} params
         * @param {Object} params.config
         * @param {import('./types').waitTime} params.config.waitTime
         * @param {import('./types').header} params.header
         * @returns {import('./types').Packet}
         */
        add({
            config,
            header: {
                method,
                trace,
                match
            } = {}
        }) {
            idx = idx + 1;
            /** @constant @type {import('./types').Packet} */
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
        /**
         * find
         * @param {Object} params
         * @param {number} params.idx
         * @param {import('./types').tag} params.tag
         * @returns {import('./types').Packet}
         */
        find({idx, tag: curtag = tag} = {}) {
            return items.find(({header: {idx: idxIn}}) => (
                idxIn === idx && tag === curtag
            ));
        },
        /**
         * fulfill
         * @param {import('./types').Packet} packet
         * @throws {NotFound}
         * @returns {function}
         */
        fulfill(packet) {
            const idx = items.findIndex((r) => r === packet);
            if (idx > -1) {
                items = items.slice(0, idx)
                    .concat(items.slice(idx + 1));

                /**
                 * resolve
                 * @param {import('./types').message} payload
                 * @returns {void}
                 */
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
        /**
         * resolve
         * @param {import('./types').message} payload
         * @param {import('./types').header} header
         * @param {import('./types').match} match
         * @param {Object} params.config
         * @param {import('./types').waitTime} params.config.waitTime
         * @returns {import('./types').acquireResp}
         */
        acquire({payload, header, match, config}) {
            if (match && match.idx && match.tag) {
                const matched = Api.find(match);
                if (matched) {
                    return {
                        found: true,
                        matched: true,
                        packet: matched
                    };
                } else {
                    return Api.acquire({payload, header});
                }
            } else {
                const found = Api.find(header);
                if (!found) {
                    return {
                        packet: Api.add({
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
        /**
         * destroy all packets
         * @throws {ForceDestroy}
         * @returns {void}
         */
        destroy() {
            return items
                .map((packet) => (
                    Api.fulfill(packet)({
                        error: ForceDestroy.create(
                            'ForceDestroy',
                            {tag}
                        )
                    }))
                );
        }
    };

    return Api;
};

module.exports = {
    Packet,
    Packets,
    /**
     * Merge 2 packets
     * @param {import('./types').message[]} packets
     * @returns {import('./types').message}
     */
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
