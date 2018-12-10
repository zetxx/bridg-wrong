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
                return t.same(message, {}, 'notification - bypass external');
            });
});

tap.test('api request - received external request', (t) => {
    class Node1 extends Node {
        constructor() {
            super();
            this.apiRequestMatchKeys = ['zumbaio'];
        }
        externalOut({message, meta}) {
            message = Object.assign({}, message, {passedTrough: 'out>in'});
            if (message.testApiRequestMatchKey) {
                return this.externalIn({message: Object.assign({}, message, {zumbaio: meta.apiRequestId}), meta: {method: 'external'}});
            } else {
                return super.externalOut({message, meta});
            }
        }
        log() {
            return Promise.resolve();
        }
    };

    const node = new Node1();

    node.registerExternalMethod({
        method: 'pingLike',
        fn: function(message) {
            if (message.dontGoOut) {
                return;
            }
            return Object.assign({'pingLike': 1}, message);
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
        fn: function(message) {
            return Object.assign({'api.out': 1}, message);
        }
    });
    node.registerExternalMethod({
        method: 'external',
        fn: function(message) {
            return Object.assign({'external': 1}, message);
        }
    });
    return Promise.resolve()
        .then(() => node.externalIn({message: {arg1: 1}, meta: {}}))
        .then((ctx) => {
            return t.same(ctx, {message: {arg1: 1}, meta: {deadIn: 1}}, 'external request, no apiRequestId matched, no testApiRequestMatchKey matched, no method matched, should not response to external');
        })
        .then(() => node.externalIn({message: {arg1: 1}, meta: {method: 'pingLike'}}))
        .then((ctx) => {
            return t.same(ctx, {message: {arg1: 1, pingLike: 1, passedTrough: 'out>in'}, meta: {method: 'pingLike'}}, 'external request, no apiRequestId matched, no testApiRequestMatchKey matched, external method executed, response should be returned');
        })
        .then(() => node.externalIn({message: {arg1: 1, dontGoOut: 1}, meta: {method: 'pingLike'}}))
        .then((ctx) => {
            return t.same(ctx, {message: {arg1: 1, dontGoOut: 1}, meta: {deadIn: 1, method: 'pingLike'}}, 'same as prev but response to ext. should not be returned');
        })
        .then(() => node.apiRequestReceived({message: {arg1: 1}, meta: {method: 'api'}}))
        .then((message) => {
            return t.same(message.error.code, 'methodTimedOut', 'method timeout');
        })
        .then(() => node.apiRequestReceived({message: {testApiRequestMatchKey: true, arg1: 1}, meta: {method: 'api'}}))
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
        externalOut({message, meta: {method, connectionId, apiRequestId}}) {
            return this.externalIn({message, meta: {method, apiRequestId}});
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
            return t.same(message, {});
        });
});
