'use strict';

const errors = require('./errors.js');

class Brid {
    constructor() {
        this.apiMethods = {};
        this.apiRequestsPool = [];
        this.apiRequestId = 1;
        this.globTraceId = 1;
    }

    async start() {
        this.log('info', {in: 'base.start'});
    }

    async stop() {
        this.log('info', {in: 'base.stop'});
    }

    getApiRequestId() {
        this.log('trace', {in: 'base.getApiRequestId'});
        return this.apiRequestId++;
    }

    getFingerprint() {
        return {};
    }

    findMethod({method, channel, direction = 'out', meta} = {}) {
        this.log('info', {in: 'base.findMethod', description: `try find method ${channel}.${method}.${direction || ''}`, method, channel, direction});
        let found = ((direction && [`${method}.${direction}`, direction, method]) || [method]).find((v) => this.apiMethods[channel] && this.apiMethods[channel][v]);

        if (!found) {
            throw new errors.NotFound('desired method not found', {state: {method, channel, direction, fingerPrint: this.getFingerprint()}});
        }
        return this.apiMethods[channel][found];
    }

    findApiMethod({method, direction = 'out', meta} = {}) {
        this.log('trace', {in: 'base.findApiMethod', method, direction});
        return this.findMethod({method, direction, channel: 'api', meta});
    }

    findExternalMethod({method, meta} = {}) {
        this.log('trace', {in: 'base.findExternalMethod', method});
        return this.findMethod({method, direction: false, channel: 'external', meta});
    }

    registerMethod({method, channel, fn, meta}) {
        this.log('info', {in: 'base.registerMethod', description: `register method: ${channel}.${method}`, method, channel, meta});
        !this.apiMethods[channel] && (this.apiMethods[channel] = {});
        this.apiMethods[channel][method] = async(ctx, ...args) => {
            let [message, meta] = args;
            this.log('trace', {in: 'base.registerMethod', description: `exec method: ${channel}.${method}`, message, meta});
            return fn.call(ctx, ...args);
        };
    }

    registerApiMethod({method, fn, meta = {}}) {
        this.log('info', {in: 'base.registerApiMethod', method, meta});
        this.registerMethod({method, fn, channel: 'api', meta});
    }

    registerExternalMethod({method, fn, meta = {}}) {
        this.log('info', {in: 'base.registerExternalMethod', method, meta});
        this.registerMethod({method, fn, channel: 'external', meta});
    }

    isApiRequest(apiRequestId) {
        this.log('trace', {in: 'base.isApiRequest', apiRequestId});
        return this.apiRequestsPool.findIndex(({meta} = {}) => meta.apiRequestId === apiRequestId);
    }

    isApiRequestByMatchKey({result}) {
        this.log('trace', {in: 'base.isApiRequestByMatchKey', result});
        var [apiRequestId] = (this.apiRequestMatchKeys || []).map((key) => result[key]).filter((el) => el);
        return apiRequestId;
    }

    findApiRequest(apiRequestId) {
        this.log('trace', {in: 'base.findApiRequest', description: `search api request with id: ${apiRequestId}`});
        var idx = this.isApiRequest(apiRequestId);

        var {meta, message} = this.apiRequestsPool[idx];
        this.apiRequestsPool = this.apiRequestsPool.slice(0, idx).concat(this.apiRequestsPool.slice(idx + 1));
        return {meta, requestMessage: message};
    }

    setStore(key, value) {
        return {};
    }

    getStore(key) {
        return {};
    }

    getGlobTrace(meta) {
        var globTrace = {};
        if (!meta.globTrace) {
            globTrace.id = ++this.globTraceId;
            globTrace.count = 1;
        } else {
            globTrace.id = meta.globTrace.id;
            globTrace.count = meta.globTrace.count + 1;
        }
        return globTrace;
    }

    getInternalCommunicationContext(meta, extraContext = {}) {
        this.log('debug', {in: 'base.getInternalCommunicationContext', meta});
        return {
            sharedContext: extraContext || {},
            request: this.remoteApiCallBuild({meta, extraContext}),
            notification: this.remoteApiCallBuild({meta, extraContext, isNotification: 1}),
            getState: (...arg) => this.getStore(...arg),
            setState: (...arg) => this.setStore(...arg)
        };
    }

    remoteApiCallBuild({meta, extraContext, isNotification = 0}) {
        return async(destination, message, metaParams = {}) => {
            this.log('trace', {in: 'base.getInternalCommunicationContext.request', destination, message, metaParams, meta});
            var globTrace = this.getGlobTrace(meta);
            try {
                let rq = this.remoteApiCall({destination, message, meta: Object.assign({}, meta, {globTrace}, metaParams, {isNotification})});
                if (!isNotification) {
                    return await rq;
                }
                rq.catch((error) => this.log('error', {in: 'base.getInternalCommunicationContext.notification.error', destination, message, metaParams, meta, error}));
            } catch (e) {
                this.log('error', {
                    in: 'base.getInternalCommunicationContext.request.response',
                    destination,
                    error: e,
                    message,
                    metaParams,
                    meta
                });
                throw e;
            }
        };
    }

    async remoteApiCall({destination, message, meta}) {
        this.log('trace', {in: 'base.remoteApiCall', description: `try to call micro-service: ${destination}`, destination, message, meta});
        throw new errors.NotImplemented();
    }

    // when someone hits api method
    apiRequestReceived({message, meta}) {
        this.log('info', {in: 'base.apiRequestReceived', count: 1, message, meta});
        return new Promise(async(resolve, reject) => {
            // create meta
            const m = Object.assign({}, meta, {resolve, reject, apiRequestId: this.getApiRequestId()});
            const pack = {meta: m};
            // push request to  queue
            this.apiRequestsPool.push(pack);
            try {
                // find api request method (method.in)
                let apiMethodFn = this.findApiMethod({method: meta.method, direction: 'in', meta: m});
                this.log('trace', {in: 'base.apiRequestReceived', count: 2, description: 'api "in" method found', message, meta: m});
                if (meta.isNotification) { // respond if notification, don't wait for anything to be executed
                    this.log('trace', {in: 'base.apiRequestReceived', count: 3, description: 'api "in" method found, but notification', message, meta: m});
                    this.apiResponseReceived({result: {}, meta: m});
                }
                // call found method
                let apiMethodFnResult = await apiMethodFn(this.getInternalCommunicationContext(m), message, Object.assign({}, m));
                if (!meta.isNotification) {
                    // put transformed response to meta
                    m.request = pack.message = apiMethodFnResult;
                }
                // send it to external only if result from api method call is full
                if (apiMethodFnResult) {
                    this.log('trace', {in: 'base.apiRequestReceived > send to external', count: 4, message, meta: m, apiMethodFnResult});
                    let extOutResP = this.externalOut({result: apiMethodFnResult, meta: m});
                    // start timer if request is not notification
                    if (!meta.isNotification && m && (m.apiRequestId || m.apiRequestId >= 0) && this.isApiRequest(m.apiRequestId) >= 0) {
                        this.log('trace', {in: 'base.apiRequestReceived > timeout started', count: 5, message, meta: m, apiMethodFnResult, extOutResP});
                        // timeout external, do timeout if it is notification, timeout means, that request to external didn't receive response that marks external call as finished
                        // for call to bi finished it should go trough apiResponseReceived
                        var timeoutId = setTimeout(() => {
                            this.log('info', {in: 'base.apiRequestReceived > method timeout', count: 6, message, meta: m, apiMethodFnResult, extOutResP});
                            return this.apiResponseReceived({error: (new errors.TimedOut({state: m})), meta: m});
                        }, meta.timeout || 30000);
                        m.timeoutId = timeoutId;
                        return await extOutResP;
                    }
                    return {};
                }
                this.log('info', {in: 'base.apiRequestReceived > skip external, result from api fn call is false', count: 7, message, meta: m, apiMethodFnResult});
                return (!meta.isNotification && this.apiResponseReceived({result: apiMethodFnResult, meta: m}));
            } catch (e) {
                this.log('error', {in: 'base.apiRequestReceived', count: 8, message, meta: m, error: e});
                return this.apiResponseReceived({error: e, meta: m});
            }
        });
    }

    // when external response received, response to previously api request, its is called when response from external are matched
    async apiResponseReceived({result, error, meta: {apiRequestId = -1}} = {}) {
        const message = (result && {result}) || (error && {error}) || undefined;
        this.log('info', {in: 'base.apiResponseReceived', result, error, apiRequestId});
        if (this.isApiRequest(apiRequestId) >= 0) { // request exists
            var {meta} = this.findApiRequest(apiRequestId); // find request
            if (meta.timeoutId) { // clear timeout if any
                this.log('trace', {in: 'base.apiResponseReceived', timeout: 'cleared', result, error, apiRequestId});
                clearTimeout(meta.timeoutId); // clear timeout
            }
            if (meta.isNotification) { // notification case
                this.log('trace', {in: 'base.apiResponseReceived', description: 'api "in" method found, but notification, returning notification: 1', result, error, apiRequestId});
                return meta.resolve({notification: 1});
            }
            try {
                let fn = this.findApiMethod({method: meta.method, direction: 'out', meta}); // find api method
                let fnResult = await fn(this.getInternalCommunicationContext(meta), message, Object.assign({}, meta)); // execute api method
                this.log('info', {in: 'base.apiResponseReceived', description: 'resolve request', result, error, apiRequestId});
                return meta.resolve(fnResult);
            } catch (e) {
                this.log('error', {in: 'base.apiResponseReceived', result, error: e, apiRequestId});
                return meta.reject(e);
            }
        }
        return undefined;
    }
    // when someone hits external
    async externalIn({result, error, meta = {}} = {}) {
        this.log('info', {in: 'base.externalIn', result, error, meta});
        var {method, apiRequestId, isNotification} = meta;
        const message = (result && {result}) || (error && {error}) || undefined;
        // find if there is api request pending by id
        if (apiRequestId) { // try to find api request in order to apply response
            if (this.isApiRequest(apiRequestId) >= 0) { // this message is response of api request
                try {
                    // find external method
                    let fnExt = this.findExternalMethod({method, meta});
                    //  call external method
                    let fnExtResult = await fnExt(this.getInternalCommunicationContext(Object.assign({direction: 'in'}, meta)), message, Object.assign({}, meta));
                    this.log('trace', {in: 'base.externalIn', description: 'external request is response of api request', result, error, meta, fnExtResult});
                    // call api response
                    return this.apiResponseReceived({result: fnExtResult, meta});
                } catch (e) {
                    this.log('error', {in: 'base.externalIn:userDefinedTransformation', error: e, meta});
                    // call api response with error
                    return this.apiResponseReceived({error: e, meta});
                }
            // there is apiRequestId but no info in api queue, this means that message is probably timeouts
            } else if (!isNotification) {
                this.log('warn', {in: 'base.externalIn', errorMessage: 'message timed out', result, error, meta});
                return {...message, meta: Object.assign({deadIn: 1}, meta)};
            }
            return {...message, meta: Object.assign({deadIn: 1}, meta)};
        } else {
            var apiRequestIdByMatchKey = this.isApiRequestByMatchKey(message); // try to match api key by matchKeys
            if (apiRequestIdByMatchKey > 0) {
                this.log('trace', {in: 'base.externalIn', description: 'external request is response of api request, matched by "apiRequestIdByMatchKey"', result, error, meta});
                return this.externalIn({result, error, meta: Object.assign({}, meta, {apiRequestId: apiRequestIdByMatchKey})});
            } else if (method) { // try to execute method and return it to caller
                this.log('trace', {in: 'base.externalIn', description: 'external request is NOT response of api request', result, error, meta});
                try {
                    let fnExt = this.findExternalMethod({method, meta});
                    let transformedMsg = await fnExt(this.getInternalCommunicationContext(meta), message, Object.assign({}, meta));
                    if (transformedMsg) { // respond to external if result from transform function is not false.
                        this.log('info', {in: 'base.externalIn', description: 'external request is NOT response of api request > send response to external', result, error, meta});
                        return this.externalOut({result: transformedMsg, meta});
                    }
                    this.log('info', {in: 'base.externalIn', description: 'external request is NOT response of api request > don\'t send response to external because user transform function returned false', result, error, meta, transformedMsg});
                    return {...message, meta: Object.assign({deadIn: 1}, meta)};
                } catch (e) {
                    this.log('error', {in: 'base.externalIn', error: e, meta});
                    return this.externalOut({error: e, meta});
                }
            } else {
                this.log('warn', {in: 'base.externalIn', errorMessage: 'message missing: apiRequestId, method', result, error, meta});
                return {...message, meta: {deadIn: 1}};
            }
        }
    }

    // when request or response goes to external
    async externalOut({result, meta}) {
        this.log('trace', {in: 'base.externalOut', result, meta});
        return {result, meta};
    }

    async log(level = 'log', message) {
        level = ((level === 'trace') && 'log') || level;
        console.log(level, '------------start');
        console[level](message);
        console.log(level, '------------stop');
        return {};
    }

    cleanMeta({timeoutId, ...metaClean}) {
        return {meta: metaClean};
    }
}

module.exports = Brid;
