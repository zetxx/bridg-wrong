const {
    NotFound,
    WaitTimeExpired,
    ForceDestroy
} = require('./errors');

let cc = 0;
const createRequest = ({
    onLocalReject,
    match,
    method,
    config = {},
    counter,
    nodeId,
    waitTime
}) => {
    const request = {
        nodeId,
        idx: counter,
        match,
        method,
        config: {
            waitTime: config.waitTime || waitTime
        }
    };
    request.promise = new Promise(
        (resolve, reject) => {
            request.resolve = resolve;
            request.reject = reject;
        }
    );
    request.timeout = setTimeout(() => {
        onLocalReject({
            error: WaitTimeExpired.create(''),
            meta: {
                idx: request.idx,
                nodeId
            }
        });
    }, request.config.waitTime);
    return request;
};

const Request = ({
    nodeId,
    config: {
        waitTime = 30000
    } = {}
} = {}) => {
    let items = [];
    let counter = 0;

    const o = {
        destroy() {
            items.map((request) => o.fulfill(request)({error: ForceDestroy.create('')}))
        },
        add({packet, match, onLocalReject}) {
            counter = counter + 1;
            const request = createRequest({
                onLocalReject,
                match,
                method: packet?.meta?.method,
                config: packet?.meta?.config,
                counter,
                nodeId,
                waitTime
            });
            items.push(request);
            return request;
        },
        find({meta: {idx, nodeId: curNodeId = nodeId} = {}} = {}) {
            return items.find(({idx: idxIn}) => (
                idxIn === idx &&
                nodeId === curNodeId
            ));
        },
        fulfill(request) {
            const idx = items.findIndex((r) => r === request);
            if (idx > -1) {
                items = items.slice(0, idx)
                    .concat(items.slice(idx + 1));

                return (packet = {}) => {
                    clearTimeout(request.timeout);
                    if (packet.error) {
                        request.reject(packet);
                    }
                    request.resolve(packet);
                };
            } else {
                throw NotFound.create('');
            }
        },
        len() {
            return items.length;
        }
    };

    return o;
};

module.exports = Request;