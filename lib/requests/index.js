const {
    NotFound,
    WaitTimeExpired,
    ForceDestroy
} = require('./errors');

let cc = 0;
const dispatchWaiter = ({
    onLocalReject,
    match,
    method,
    config = {},
    counter,
    nodeId,
    waitTime
}) => {
    const waiter = {
        nodeId,
        idx: counter,
        match,
        method,
        config: {
            waitTime: config.waitTime || waitTime
        }
    };
    waiter.promise = new Promise(
        (resolve, reject) => {
            waiter.resolve = resolve;
            waiter.reject = reject;
        }
    );
    waiter.timeout = setTimeout(() => {
        onLocalReject({
            error: WaitTimeExpired.create(''),
            meta: {
                idx: waiter.idx,
                nodeId
            }
        });
    }, waiter.config.waitTime);
    return waiter;
};

const Waiter = ({
    nodeId,
    config: {
        waitTime = 30000
    } = {}
} = {}) => {
    let items = [];
    let counter = 0;

    const o = {
        destroy() {
            items.map((waiter) => o.fulfill(waiter)({error: ForceDestroy.create('')}))
        },
        add({packet, match, onLocalReject}) {
            counter = counter + 1;
            const waiter = dispatchWaiter({
                onLocalReject,
                match,
                method: packet?.meta?.method,
                config: packet?.meta?.config,
                counter,
                nodeId,
                waitTime
            });
            items.push(waiter);
            return waiter;
        },
        find({meta: {idx, nodeId: curNodeId = nodeId} = {}} = {}) {
            return items.find(({idx: idxIn}) => (
                idxIn === idx &&
                nodeId === curNodeId
            ));
        },
        fulfill(waiter) {
            const idx = items.findIndex((r) => r === waiter);
            if (idx > -1) {
                items = items.slice(0, idx)
                    .concat(items.slice(idx + 1));

                return (packet = {}) => {
                    clearTimeout(waiter.timeout);
                    if (packet.error) {
                        waiter.reject(packet);
                    }
                    waiter.resolve(packet);
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

module.exports = Waiter;
