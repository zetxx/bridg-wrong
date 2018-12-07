const errors = require('./errors.js');

class Brid {
    constructor() {
        this.nodeMethods = {};
        this.apiRequestsPool = [];
        this.apiRequestId = 1;
    }

    start() {
        console.info('start');
        return Promise.resolve();
    }

    stop() {
        console.info('stop');
        return Promise.resolve();
    }

    getApiRequestId() {
        console.info('getApiRequestId');
        return this.apiRequestId++;
    }

    findMethod({method, channel, direction = 'out'} = {}) {
        console.info('findMethod');
        let found = ((direction && [`${method}.${direction}`, direction, method]) || [method]).find((v) => this.nodeMethods[channel] && this.nodeMethods[channel][v]);

        if (!found) {
            return Promise.reject(errors.methodNotFound(method, channel, direction));
        }
        return Promise.resolve(this.nodeMethods[channel][found]);
    }

    findApiMethod({method, direction = 'out'} = {}) {
        console.info('findApiMethod');
        return this.findMethod({method, direction, channel: 'api'});
    }

    findExternalMethod({method} = {}) {
        console.info('findExternalMethod');
        return this.findMethod({method, direction: false, channel: 'external'});
    }

    registerMethod({method, channel, fn}) {
        console.info('registerMethod');
        !this.nodeMethods[channel] && (this.nodeMethods[channel] = {});
        this.nodeMethods[channel][method] = (ctx, ...args) => (Promise.resolve().then(() => {
            return fn.call(ctx, ...args);
        }));
    }

    registerApiMethod({method, fn}) {
        console.info('registerApiMethod');
        this.registerMethod({method, fn, channel: 'api'});
    }

    registerExternalMethod({method, fn}) {
        console.info('registerExternalMethod');
        this.registerMethod({method, fn, channel: 'external'});
    }

    isApiRequest(apiRequestId) {
        console.info('isApiRequest');
        return this.apiRequestsPool.findIndex(({meta} = {}) => meta.apiRequestId === apiRequestId);
    }

    isApiRequestByMatchKey(message) {
        console.info('isApiRequestByMatchKey');
        var [apiRequestId] = (this.apiRequestMatchKeys || []).map((key) => message[key]).filter((el) => el);
        return apiRequestId;
    }

    findApiRequest(apiRequestId) {
        console.info('findApiRequest');
        var idx = this.isApiRequest(apiRequestId);

        var {meta, message} = this.apiRequestsPool[idx];
        this.apiRequestsPool = this.apiRequestsPool.slice(0, idx).concat(this.apiRequestsPool.slice(idx + 1));
        return {meta, requestMessage: message};
    }

    getInternalCommunicationContext(meta) {
        console.info('getInternalCommunicationContext');
        return {
            request: (destination, message) => Promise.resolve().then(() => this.remoteApiRequest({destination, message, meta})),
            notification: () => {}
        };
    }

    remoteApiRequest({destination, message, meta}) {
        console.info('remoteApiRequest');
        return Promise.reject(errors.notImplemented());
    }

    // when someone hits api method
    apiRequestReceived({message, meta}) {
        console.info('apiRequestReceived');
        return new Promise((resolve, reject) => {
            // create meta
            const m = Object.assign({}, meta, {resolve, reject, apiRequestId: this.getApiRequestId()});
            const pack = {meta: m};
            // push request to  queue
            this.apiRequestsPool.push(pack);
            // find api request method (method.in)
            return this.findApiMethod({method: meta.method, direction: 'in'})
                .then((fn) => {
                    if (meta.isNotification) { // respond if notification
                        this.apiResponseReceived({message: {}, meta: m});
                    }
                    // call found method
                    return fn(this.getInternalCommunicationContext(m), message);
                })
                .then((transformedResult) => {
                    // put transformet response to meta
                    return Promise.resolve((pack.message = transformedResult) && (m.request = transformedResult)).then(() => transformedResult);
                })
                .then((transformedResult) => {
                    // send it to external
                    return this.externalOut({message: transformedResult, meta: m})
                        .then((res) =>
                            Promise.resolve()
                                .then(() =>
                                    !meta.isNotification && setTimeout(() => { // timeout external, do do timeout if it is notification
                                        return this.apiResponseReceived({message: errors.methodTimedOut(m), meta: m});
                                    }, 3000)
                                )
                                .then(() => res)
                        );
                })
                .catch((e) => {
                    console.error('apiRequestReceived', e);
                    return this.apiResponseReceived({message: e, meta: m});
                });
        });
    }

    // when external response received, response to previously api request, its is called when response from external are matched
    apiResponseReceived({message, meta: {apiRequestId = -1}} = {}) {
        console.info('apiResponseReceived');
        if (this.isApiRequest(apiRequestId) >= 0) {
            var {meta} = this.findApiRequest(apiRequestId);
            return this.findApiMethod({method: meta.method, direction: 'out'})
                .then((fn) => {
                    return (!meta.isNotification && fn(this.getInternalCommunicationContext(meta), message)) || Promise.resolve({});
                })
                .then((result) => {
                    return meta.resolve(result);
                })
                .catch((e) => {
                    console.error('apiResponseReceived', e);
                    meta.reject(e);
                });
        }
        return Promise.resolve();
    }
    // when someone hits external
    externalIn({message, meta = {}} = {}) {
        console.info('externalIn');
        var {method, apiRequestId, isNotification} = meta;

        // find if there is api request pending
        if (apiRequestId) { // try to find api request in order to apply response
            if (this.isApiRequest(apiRequestId) >= 0) { // this message is response of api request
                // call api response
                return this.apiResponseReceived({message, meta});
            } else if (!isNotification) { // message timeouted
                console.warn('externalIn', 'message timed out');
                return Promise.resolve({message, meta: Object.assign({deadIn: 1}, meta)});
            }
            return Promise.resolve({message, meta: Object.assign({deadIn: 1}, meta)});
        } else {
            var apiRequestIdByMatchKey = this.isApiRequestByMatchKey(message); // try to match api key by matchKeys
            if (apiRequestIdByMatchKey > 0) {
                return this.externalIn({message, meta: Object.assign({}, meta, {apiRequestId: apiRequestIdByMatchKey})});
            } else if (method) { // try to execute method and return it to caller
                return this.findExternalMethod({method})
                    .then((fn) => {
                        return fn(this.getInternalCommunicationContext(meta), message);
                    })
                    .then((transformedMsg) => {
                        return (transformedMsg && this.externalOut({message: transformedMsg, meta})) || Promise.resolve({message, meta: Object.assign({deadIn: 1}, meta)});
                    })
                    .catch((e) => {
                        console.error(e);
                    });
            } else {
                console.warn('message missing: apiRequestId, method');
                return Promise.resolve({message, meta: {deadIn: 1}});
            }
        }
    }

    // when request or response goes to external
    externalOut(...args) {
        console.info('externalOut');
        return Promise.resolve(...args);
    }
};

module.exports = Brid;
