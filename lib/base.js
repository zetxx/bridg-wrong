const util = require('util');
const errors = require('./errors.js');

function Node() {
    this.nodeMethods = {};
    this.apiRequestsPool = [];
};

/**
 * calls every time when node is ready
 */
Node.prototype.start = function() {
    return Promise.resolve();
};

Node.prototype.getApiRequestId = (() => {
    var apiRequestId = 1;
    return () => apiRequestId++;
})();

/**
 * @param {String} method - method name
 * @param {String} channel - api or external
 * @param {String} direction - in or out
 */

Node.prototype.findMethod = function({method, channel, direction = 'out'} = {}) {
    let found = ((direction && [`${method}.${direction}`, direction, method]) || [method]).find((v) => this.nodeMethods[channel] && this.nodeMethods[channel][v]);

    if (!found) {
        return Promise.reject(errors.methodNotFound(method, channel, direction));
    }
    return Promise.resolve(this.nodeMethods[channel][found]);
};

/**
 * @param {String} method - method name
 * @param {String} direction - in or out
 */
Node.prototype.findApiMethod = function({method, direction = 'out'} = {}) {
    return this.findMethod({method, direction, channel: 'api'});
};

/**
 * @param {String} method - method name
 * @param {String} direction - in or out
 */
Node.prototype.findExternalMethod = function({method} = {}) {
    return this.findMethod({method, direction: false, channel: 'external'});
};

/**
 * @param {String} name - function name
 * @param {String} channel - api or external
 * @param {function} fn - function itself
 */
Node.prototype.registerMethod = function({method, channel, fn}) {
    !this.nodeMethods[channel] && (this.nodeMethods[channel] = {});
    this.nodeMethods[channel][method] = (...args) => (Promise.resolve().then(() => fn(...args)));
};

/**
 * @param {String} name - function name
 * @param {function} fn - function itself
 */
Node.prototype.registerApiMethod = function({method, fn}) {
    this.registerMethod({method, fn, channel: 'api'});
};

/**
 * @param {String} name - function name
 * @param {function} fn - function itself
 */
Node.prototype.registerExternalMethod = function({method, fn}) {
    this.registerMethod({method, fn, channel: 'external'});
};

Node.prototype.isApiRequest = function(apiRequestId) {
    return this.apiRequestsPool.findIndex(({meta} = {}) => meta.apiRequestId === apiRequestId);
};

Node.prototype.isApiRequestByMatchKey = function(message) {
    var [apiRequestId,] = (this.apiRequestMatchKeys || []).map((key) => message[key]).filter((el) => el);
    return apiRequestId;
};

Node.prototype.findApiRequest = function(apiRequestId) {
    var idx = this.isApiRequest(apiRequestId);

    var {meta, message} = this.apiRequestsPool[idx];
    this.apiRequestsPool = this.apiRequestsPool.slice(0, idx).concat(this.apiRequestsPool.slice(idx + 1));
    return {meta, requestMessage: message};
};

Node.prototype.getInternalCommunicationContext = function() {
    return {request: () => {}, notification: () => {}};
};

// when someone hits api method
Node.prototype.apiRequestReceived = function({message, meta}) {
    return new Promise((resolve, reject) => {
        // create meta
        const m = Object.assign({}, meta, {resolve, reject, apiRequestId: this.getApiRequestId()});
        const pack = {meta: m};
        // push request to  queue
        this.apiRequestsPool.push(pack);
        // find api request method (method.in)
        return this.findApiMethod({method: meta.method, direction: 'in'})
            .then((fn) => {
                // call found method
                return fn.call(this.getInternalCommunicationContext(), message);
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
                                setTimeout(() => { // timeout external
                                    return this.apiResponseReceived({message: errors.methodTimedOut(m), meta: {apiRequestId: m.apiRequestId}});
                                }, 3000)
                            )
                            .then(() => res)
                    );
            })
            .catch((e) => {
                console.error('apiRequestReceived', e);
                return this.apiResponseReceived({message: e, meta: {apiRequestId: m.apiRequestId}});
            });
    });
};
// when external response received, response to previously api request, its is called when response from external are matched
Node.prototype.apiResponseReceived = function({message, meta} = {}) {
    var {apiRequestId = -1} = meta;
    if (this.isApiRequest(apiRequestId) >= 0) {
        var {meta} = this.findApiRequest(apiRequestId);
        return this.findApiMethod({method: meta.method, direction: 'out'})
            .then((fn) => {
                return fn.call(this.getInternalCommunicationContext(), message);
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
};

// when someone hits external
Node.prototype.externalIn = function({message, meta = {}} = {}) {
    var {connectionId, method, apiRequestId} = meta;

    // find if there is api request pending
    if (apiRequestId) { // try to find api request in order to apply response
        if (this.isApiRequest(apiRequestId) >= 0) { // this message is response of api request
            // call api response
            return this.apiResponseReceived({message, meta: {apiRequestId}});
        } else { // message timeouted
            console.warn('externalIn', 'message timed out');
            return Promise.resolve({message, meta: {deadIn: 1}});
        }
    } else {
        var apiRequestIdByMatchKey = this.isApiRequestByMatchKey(message); // try to match api key by matchKeys
        if (apiRequestIdByMatchKey > 0) {
            return this.externalIn({message, meta: Object.assign({}, meta, {apiRequestId: apiRequestIdByMatchKey})});
        } else if (method) { // try to execute method and return it to caller
            return this.findExternalMethod({method})
                .then((fn) => {
                    return fn.call(this.getInternalCommunicationContext(), message);
                })
                .then((transformedMsg) => {
                    return (transformedMsg && this.externalOut({message: transformedMsg, meta: {connectionId, method, apiRequestId}})) || Promise.resolve({message, meta: {deadIn: 1}});
                })
                .catch((e) => {
                    console.error(e);
                    meta.reject(e);
                });
        } else {
            console.warn('message missing: apiRequestId, method');
            return Promise.resolve({message, meta: {deadIn: 1}});
        }
    }
};

// when request or response goes to external
Node.prototype.externalOut = function(...args) {
    return Promise.resolve(...args);
};

module.exports = ({current, parent = Node} = {}) => {
    util.inherits(current, parent);
    current.prototype.parent = parent;
    return current;
};
