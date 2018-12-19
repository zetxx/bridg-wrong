'use strict';

const errors = require('./errors.js');

class Brid {
    constructor() {
        this.nodeMethods = {};
        this.apiRequestsPool = [];
        this.apiRequestId = 1;
        this.state = {};
    }

    start() {
        this.log('info', {in: 'method:start'});
        return Promise.resolve();
    }

    stop() {
        this.log('info', {in: 'method:stop'});
        return Promise.resolve();
    }

    getApiRequestId() {
        this.log('info', {in: 'method:getApiRequestId'});
        return this.apiRequestId++;
    }

    getFingerprint() {
        return {};
    }

    findMethod({method, channel, direction = 'out'} = {}) {
        this.log('info', {in: 'method:findMethod'});
        let found = ((direction && [`${method}.${direction}`, direction, method]) || [method]).find((v) => this.nodeMethods[channel] && this.nodeMethods[channel][v]);

        if (!found) {
            return Promise.reject(errors.methodNotFound({method, channel, direction, fingerPrint: this.getFingerprint()}));
        }
        return Promise.resolve(this.nodeMethods[channel][found]);
    }

    findApiMethod({method, direction = 'out'} = {}) {
        this.log('info', {in: 'method:findApiMethod'});
        return this.findMethod({method, direction, channel: 'api'});
    }

    findExternalMethod({method} = {}) {
        this.log('info', {in: 'method:findExternalMethod'});
        return this.findMethod({method, direction: false, channel: 'external'});
    }

    registerMethod({method, channel, fn, meta}) {
        this.log('info', {in: 'method:registerMethod', method, channel, meta});
        !this.nodeMethods[channel] && (this.nodeMethods[channel] = {});
        this.nodeMethods[channel][method] = (ctx, ...args) => (Promise.resolve().then(() => {
            return fn.call(ctx, ...args);
        }));
    }

    registerApiMethod({method, fn, meta = {}}) {
        this.log('info', {in: 'method:registerApiMethod'});
        this.registerMethod({method, fn, channel: 'api', meta});
    }

    registerExternalMethod({method, fn, meta = {}}) {
        this.log('info', {in: 'method:registerExternalMethod'});
        this.registerMethod({method, fn, channel: 'external', meta});
    }

    isApiRequest(apiRequestId) {
        this.log('info', {in: 'method:isApiRequest'});
        return this.apiRequestsPool.findIndex(({meta} = {}) => meta.apiRequestId === apiRequestId);
    }

    isApiRequestByMatchKey(message) {
        this.log('info', {in: 'method:isApiRequestByMatchKey'});
        var [apiRequestId] = (this.apiRequestMatchKeys || []).map((key) => message[key]).filter((el) => el);
        return apiRequestId;
    }

    findApiRequest(apiRequestId) {
        this.log('info', {in: 'method:findApiRequest'});
        var idx = this.isApiRequest(apiRequestId);

        var {meta, message} = this.apiRequestsPool[idx];
        this.apiRequestsPool = this.apiRequestsPool.slice(0, idx).concat(this.apiRequestsPool.slice(idx + 1));
        return {meta, requestMessage: message};
    }

    setState({key, value} = {}) {
        this.state[key] = value;
    }

    getState({key} = {}) {
        return this.state[key];
    }

    getInternalCommunicationContext(meta) {
        this.log('info', {in: 'method:getInternalCommunicationContext'});
        return {
            request: (destination, message) => Promise.resolve().then(() => this.remoteApiRequest({destination, message, meta})),
            notification: (destination, message) => {
                this.remoteApiRequest({destination, message, meta: Object.assign({isNotification: 1}, meta)});
                return Promise.resolve({});
            },
            getState: (arg) => this.getState(arg),
            setState: (arg) => this.setState(arg)
        };
    }

    remoteApiRequest({destination, message, meta}) {
        this.log('info', {in: 'method:remoteApiRequest'});
        return Promise.reject(errors.notImplemented());
    }

    // when someone hits api method
    apiRequestReceived({message, meta}) {
        this.log('info', {in: 'method:apiRequestReceived'});
        return new Promise((resolve, reject) => {
            // create meta
            const m = Object.assign({}, meta, {resolve, reject, apiRequestId: this.getApiRequestId()});
            const pack = {meta: m};
            // push request to  queue
            this.apiRequestsPool.push(pack);
            // find api request method (method.in)
            return this.findApiMethod({method: meta.method, direction: 'in'})
                .then((fn) => {
                    if (meta.isNotification) { // respond if notification, dont wait for anything to be executed
                        this.apiResponseReceived({message: {}, meta: m});
                    }
                    // call found method
                    return fn(this.getInternalCommunicationContext(m), message, Object.assign({}, m));
                })
                // put transformed response to meta
                .then((transformedResult) =>
                    Promise.resolve(!meta.isNotification && (pack.message = transformedResult) && (m.request = transformedResult))
                        .then(() => transformedResult)
                )
                // send it to external
                .then((transformedResult) => {
                    // send it to external only if result from api method call is full
                    if (transformedResult) {
                        this.log('info', {in: 'method:apiRequestReceived>send to external'});
                        return this.externalOut({message: transformedResult, meta: m})
                            .then((res) =>
                                Promise.resolve()
                                    .then(() =>
                                        !meta.isNotification && setTimeout(() => { // timeout external, do do timeout if it is notification
                                            return this.apiResponseReceived({message: {error: errors.methodTimedOut(m)}, meta: m});
                                        }, 3000)
                                    )
                                    .then(() => res)
                            );
                    }
                    this.log('info', {in: 'method:apiRequestReceived>dont send to external, result from api fn call is false'});
                    return this.apiResponseReceived({message: transformedResult, meta: m});
                })
                .catch((error) => {
                    this.log('error', {in: 'method:apiRequestReceived', error});
                    return this.apiResponseReceived({message: error, meta: m});
                });
        });
    }

    // when external response received, response to previously api request, its is called when response from external are matched
    apiResponseReceived({message, meta: {apiRequestId = -1}} = {}) {
        this.log('info', {in: 'method:apiResponseReceived'});
        if (this.isApiRequest(apiRequestId) >= 0) {
            var {meta} = this.findApiRequest(apiRequestId);
            return ((!meta.isNotification && this.findApiMethod({method: meta.method, direction: 'out'})) || Promise.resolve(message))
                .then((fn) => {
                    return (!meta.isNotification && fn(this.getInternalCommunicationContext(meta), message, Object.assign({}, meta))) || Promise.resolve({});
                })
                .then((result) => {
                    return meta.resolve(result);
                })
                .catch((error) => {
                    this.log('error', {in: 'method:apiResponseReceived', error});
                    meta.reject(error);
                });
        }
        return Promise.resolve();
    }
    // when someone hits external
    externalIn({message, meta = {}} = {}) {
        this.log('info', {in: 'method:externalIn'});
        var {method, apiRequestId, isNotification} = meta;

        // find if there is api request pending by id
        if (apiRequestId) { // try to find api request in order to apply response
            if (this.isApiRequest(apiRequestId) >= 0) { // this message is response of api request
                // find external method and call it
                return this.findExternalMethod({method}).then((fn) => fn(this.getInternalCommunicationContext(Object.assign({direction: 'in'}, meta)), message, Object.assign({}, meta)))
                    .catch((error) => {
                        this.log('error', {in: `method:externalIn:userDefinedTransformation`, error});
                        return {error};
                    })
                    // call api response
                    .then((message) => {
                        return this.apiResponseReceived({message, meta});
                    });
            // there is apiRequestId but no info in api queue, this means that message is probably timeouts
            } else if (!isNotification) {
                this.log('warn', {in: 'method:externalIn', error: 'message timed out'});
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
                        return fn(this.getInternalCommunicationContext(meta), message, Object.assign({}, meta));
                    })
                    .then((transformedMsg) => {
                        if (transformedMsg) { // respond to external if result from transform function is not false.
                            return this.externalOut({message: transformedMsg, meta});
                        }
                        return Promise.resolve({message, meta: Object.assign({deadIn: 1}, meta)});
                    })
                    .catch((error) => {
                        this.log('error', {in: 'method:externalIn', error});
                    });
            } else {
                this.log('warn', {in: 'method:externalIn', error: 'message missing: apiRequestId, method'});
                return Promise.resolve({message, meta: {deadIn: 1}});
            }
        }
    }

    // when request or response goes to external
    externalOut(...args) {
        this.log('info', {in: 'method:externalOut', ...args});
        return Promise.resolve(...args);
    }

    log(level = 'log', message) {
        console[level](message);
        return Promise.resolve({});
    }
};

module.exports = Brid;
