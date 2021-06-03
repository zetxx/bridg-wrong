let cc = 0;
const Request = ({
    nodeId,
    config: {
        waitTime = 30000,
        debug = true
    } = {}
} = {}) => {
    let items = [];
    let counter = 0;
    debug && setInterval(() => {console.log(nodeId, items.length)}, 3000);

    const createRequest = ({
        onLocalReject,
        match
    }) => {
        counter = counter + 1;
        const request = {
            nodeId,
            idx: counter,
            match
        };
        request.promise = new Promise(
            (resolve, reject) => {
                request.resolve = resolve;
                request.reject = reject;
            }
        );
        request.timeout = setTimeout(() => {
            onLocalReject({
                error: new Error('request.waitTimeExpired'),
                meta: {
                    idx: request.idx,
                    nodeId
                }
            });
        }, waitTime);
        return request;
    };

    return {
        add(packet, match, onLocalReject) {
            const request = createRequest({
                onLocalReject,
                match
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
                throw new Error('request.notFound');
            }
        }
    };
};

module.exports = Request;