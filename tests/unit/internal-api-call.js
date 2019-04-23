'use strict';
const tap = require('tap');
const Node = require('../../index.js');

tap.test('api', (t) => {
    var externalOutCallCounter = 0;
    class Node1 extends Node {
        externalOut({message, meta: {method, connectionId, apiRequestId}}) {
            externalOutCallCounter++;
            return super.externalOut({message, meta: {method, apiRequestId}})
                .then((msg) => {
                    return this.externalIn({message: msg.message, meta: {method: 'external', apiRequestId}});
                });
        }
        log() {
            return Promise.resolve();
        }
    };
    const node = new Node1();
    node.registerApiMethod({
        method: 'api.in',
        fn: function(message) {
            if (message.returnEmptyInApiIn) {
                return false;
            }
            return Object.assign({'api.in': 1}, message);
        }
    });
    node.registerApiMethod({
        method: 'api.out',
        fn: function(message) {
            return Object.assign({'api.out': 1, externalOutCallCounter}, (message && message) || {skipExternal: 1});
        }
    });
    node.registerExternalMethod({
        method: 'external',
        fn: function(message) {
            return Object.assign({'external': 1, externalOutCallCounter}, message);
        }
    });
    return Promise.resolve()
        .then(() => node.apiRequestReceived({message: {arg1: 1, returnEmptyInApiIn: 1}, meta: {method: 'api'}}))
        .then((message) => {
            return t.same(message, {'api.out': 1, skipExternal: 1, externalOutCallCounter: 0}, 'request - bypass external');
        })
        .then(() => node.apiRequestReceived({message: {arg1: 1, returnEmptyInApiIn: 1}, meta: {method: 'api', isNotification: 1}}))
        .then((message) => {
            return t.same(message, {notification: 1}, 'notification - bypass external');
        });
});

tap.test('api request - received external request', (t) => {
    class Node1 extends Node {
        constructor() {
            super();
            this.apiRequestMatchKeys = ['zumbaio'];
        }
        externalOut({result, meta}) {
            result = Object.assign({}, result, {passedTrough: 'out>in'});
            if (result.testApiRequestMatchKey) {
                return this.externalIn({result: Object.assign({}, result, {zumbaio: meta.apiRequestId}), meta: {method: 'external'}});
            } else {
                return super.externalOut({result, meta});
            }
        }
        log() {
            return Promise.resolve();
        }
    };

    const node = new Node1();

    node.registerExternalMethod({
        method: 'pingLike',
        fn: function({result}) {
            if (result.dontGoOut) {
                return;
            }
            return Object.assign({'pingLike': 1}, result);
        }
    });
    node.registerApiMethod({
        method: 'api.in',
        fn: function(message) {
            if (message.returnEmptyInApiIn) {
                return false;
            }
            return Object.assign({'api.in': 1}, message);
        }
    });
    node.registerApiMethod({
        method: 'api.out',
        fn: function({result, error}) {
            return (error && {error}) || Object.assign({'api.out': 1}, result);
        }
    });
    node.registerExternalMethod({
        method: 'external',
        fn: function({result}) {
            return Object.assign({'external': 1}, result);
        }
    });
    return Promise.resolve()
        .then(() => node.externalIn({result: {arg1: 1}, meta: {}}))
        .then((ctx) => {
            return t.same(ctx, {result: {arg1: 1}, meta: {deadIn: 1}}, 'external request, no apiRequestId matched, no testApiRequestMatchKey matched, no method matched, should not response to external');
        })
        .then(() => {
            return node.externalIn({result: {arg1: 1}, meta: {method: 'pingLike'}});
        })
        .then((ctx) => {
            return t.same(ctx, {result: {arg1: 1, pingLike: 1, passedTrough: 'out>in'}, meta: {method: 'pingLike'}}, 'external request, no apiRequestId matched, no testApiRequestMatchKey matched, external method executed, response should be returned');
        })
        .then(() => node.externalIn({result: {arg1: 1, dontGoOut: 1}, meta: {method: 'pingLike'}}))
        .then((ctx) => {
            return t.same(ctx, {result: {arg1: 1, dontGoOut: 1}, meta: {deadIn: 1, method: 'pingLike'}}, 'same as prev but response to ext. should not be returned');
        })
        .then(() => {
            return node.apiRequestReceived({message: {arg1: 1}, meta: {method: 'api', timeout: 3000}});
        })
        .then(({error}) => {
            return t.same(error.code, 'methodTimedOut', 'method timeout');
        })
        .then(() => {
            return node.apiRequestReceived({message: {testApiRequestMatchKey: true, arg1: 1}, meta: {method: 'api'}});
        })
        .then((message) => {
            return t.same(message, {'api.in': 1, 'api.out': 1, arg1: 1, testApiRequestMatchKey: true, zumbaio: message.zumbaio, passedTrough: 'out>in', external: 1}, 'test match by testApiRequestMatchKey');
        })
        .then(() => node.apiRequestReceived({message: {testApiRequestMatchKey: true, arg1: 1}, meta: {method: 'api'}}))
        .then((message) => {
            return t.same(message, {'api.in': 1, 'api.out': 1, arg1: 1, testApiRequestMatchKey: true, zumbaio: message.zumbaio, passedTrough: 'out>in', external: 1}, 'test match by testApiRequestMatchKey');
        });
});

tap.test('api notification', (t) => {
    class Node1 extends Node {
        externalOut({result, meta: {method, connectionId, apiRequestId}}) {
            return this.externalIn({result, meta: {method, apiRequestId}});
        }
        log() {
            return Promise.resolve();
        }
    };
    const node = new Node1();
    node.registerApiMethod({
        method: 'api.in',
        fn: function(message) {
            return Object.assign({'api.in': 1}, message);
        }
    });
    node.registerApiMethod({
        method: 'api.out',
        fn: function(message) {
            return Object.assign({'should never be called': 1}, message);
        }
    });
    return node.apiRequestReceived({message: {arg1: 1}, meta: {method: 'api', isNotification: 1}})
        .then((message) => {
            return t.same(message, {notification: 1});
        });
});
