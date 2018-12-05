const tap = require('tap');
const Node = require('../../index.js');

tap.test('api request - bypass external', (t) => {
    class Node1 extends Node {
        externalOut({message, meta: {method, connectionId, apiRequestId}}) {
            return super.externalOut({message, meta: {method, apiRequestId}})
                .then((msg) => {
                    return this.externalIn({message: msg.message, meta: {method, apiRequestId}});
                });
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
            return Object.assign({'api.out': 1}, message);
        }
    });
    node.registerExternalMethod({
        method: 'external',
        fn: function(message) {
            return Object.assign({'external': 1}, message);
        }
    });
    return node.apiRequestReceived({message: {arg1: 1}, meta: {method: 'api'}})
        .then((message) => {
            return t.same(message, {'api.in': 1, 'api.out': 1, arg1: 1});
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
                return this.externalIn({message: Object.assign({}, message, {zumbaio: meta.apiRequestId}), meta: {apiRequestMatchKey: meta.apiRequestMatchKey}});
            } else {
                return super.externalOut({message, meta});
            }
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
            return Object.assign({'api.in': 1}, message);
        }
    });
    node.registerApiMethod({
        method: 'api.out',
        fn: function(message) {
            return Object.assign({'api.out': 1}, message);
        }
    });
    return Promise.all([
        node.externalIn({message: {arg1: 1}, meta: {}})
            .then((ctx) => {
                return t.same(ctx, {message: {arg1: 1}, meta: {deadIn: 1}}, 'external request, no apiRequestId matched, no testApiRequestMatchKey matched, no method matched, should not response to external');
            }),
        node.externalIn({message: {arg1: 1}, meta: {method: 'pingLike'}})
            .then((ctx) => {
                return t.same(ctx, {message: {arg1: 1, pingLike: 1, passedTrough: 'out>in'}, meta: {method: 'pingLike', apiRequestId: undefined, connectionId: undefined}}, 'external request, no apiRequestId matched, no testApiRequestMatchKey matched, external method executen, response should be returned');
            }),
        node.externalIn({message: {arg1: 1, dontGoOut: 1}, meta: {method: 'pingLike'}})
            .then((ctx) => {
                return t.same(ctx, {message: {arg1: 1, dontGoOut: 1}, meta: {deadIn: 1}}, 'same as prev but response to ext. should not be returned');
            }),
        node.apiRequestReceived({message: {arg1: 1}, meta: {method: 'api'}})
            .then((message) => {
                return t.same(message.code, 'methodTimedOut', 'method timeout');
            }),
        node.apiRequestReceived({message: {testApiRequestMatchKey: true, arg1: 1}, meta: {method: 'api'}})
            .then((message) => {
                return t.same(message, {'api.in': 1, 'api.out': 1, arg1: 1, testApiRequestMatchKey: true, zumbaio: message.zumbaio, passedTrough: 'out>in'}, 'test match by testApiRequestMatchKey');
            }),
        node.apiRequestReceived({message: {testApiRequestMatchKey: true, arg1: 1}, meta: {method: 'api'}})
            .then((message) => {
                return t.same(message, {'api.in': 1, 'api.out': 1, arg1: 1, testApiRequestMatchKey: true, zumbaio: message.zumbaio, passedTrough: 'out>in'}, 'test match by testApiRequestMatchKey');
            })
    ]);
});
