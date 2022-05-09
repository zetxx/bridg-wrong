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
    direction,
    config = {},
    counter,
    tag,
    waitTime
}) => {
    const request = {
        tag,
        idx: counter,
        // consist of previous request meta that needs to be matched against
        match,
        method,
        direction,
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
            error: WaitTimeExpired.create(
                'WaitTimeExpired',
                {tag}
            ),
            meta: {
                idx: request.idx,
                tag,
                direction,
                match,
                method
            }
        });
    }, request.config.waitTime);
    return request;
};

const Request = ({
    tag,
    config: {
        waitTime = 30000
    } = {}
} = {}) => {
    let items = [];
    let counter = 0;

    const o = {
        destroy() {
            items.map((request) =>
                o.fulfill(request)({
                    error: ForceDestroy.create(
                        'ForceDestroy',
                        {tag}
                    )
                }))
        },
        add({
            packet: {
                match,
                meta: {
                    method,
                    direction,
                    config
                } = {}
            } = {},
            onLocalReject
        }) {
            counter = counter + 1;
            const request = createRequest({
                onLocalReject,
                match,
                method,
                direction,
                config,
                counter,
                tag,
                waitTime
            });
            items.push(request);
            return request;
        },
        find({meta: {idx, tag: curtag = tag} = {}} = {}) {
            return items.find(({idx: idxIn}) => (
                idxIn === idx &&
                tag === curtag
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
                throw NotFound.create(
                    'RequestNotFound',
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

module.exports = Request;