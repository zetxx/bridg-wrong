const Methods = require('../methods');
const Requests = require('../requests');
let countId = 0;

const Vector = ({
    log,
    config: {
        request = {
            waitTime: 30000
        },
        id 
    } = {}
} = {}) => {
    const config = {
        request
    };
    const tag = Symbol(id || ++countId);
    const hooks = Methods({tag, log});
    const requests = Requests({
        tag,
        config: config.request,
        log
    });

    const acquireRequest = ({payload, meta, match}) => {
        if (match && match.idx && match.tag) {
            return requests.find(match || meta);
        } else {
            const found = requests.find(meta);
            if (!found) {
                return requests.add({
                    packet: {
                        payload,
                        match,
                        meta
                    },
                    onLocalReject: (errorFullPacket) => {
                        throw new Error('what todo?');
                    }
                });
            }
            return found;
        }
    };

    const pass = ({
        packet: {
            payload,
            meta: {...meta} = {},
            match: {...match} = {}
        }
    }) => {
        // search for previous Request
        const request = acquireRequest({payload, meta, match});
        // start to work with found
        // exec hook
        // return request
    };

    return {
        pass,
        hooks,
        requests: requests,
        async start() {
            return 'done';
        },
        destroy() {
            if (requests){
                requests.destroy();
            }
        }
    };
};

module.exports = Vector;
