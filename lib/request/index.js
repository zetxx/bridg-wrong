const {
    NotFound,
    WaitTimeExpired,
    ForceDestroy
} = require('./errors');

let cc = 0;
const createRequest = ({
    onLocalReject,
    match,
    config = {},
    counter,
    nodeId,
    waitTime
}) => {
    const request = {
        nodeId,
        idx: counter,
        match,
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
            error: new WaitTimeExpired(),
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
            items.map((request) => o.fulfill(request)({error: new ForceDestroy()}))
        },
        add({packet, match, onLocalReject}) {
            counter = counter + 1;
            const request = createRequest({
                onLocalReject,
                match,
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
                throw new NotFound();
            }
        }
    };

    return o;
};

module.exports = Request;