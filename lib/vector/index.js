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

    const pass = ({
        packet: {
            payload: {...payload},
            meta: {...meta} = {},
            match: {...match} = {}
        }
    }) => {
        // create request
        const requestTmp = requests.add({
            packet: {
                payload,
                meta,
                match
            },
            onLocalReject: (errorFullPacket) => {
                // what to do ?
            }
        });
        // search for previous Request
        const requestFound = requests.find(packet);
            // 1) cancel just created
            // 2) start to work with found
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
