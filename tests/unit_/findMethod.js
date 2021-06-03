const tap = require('tap');
const Node = require('../../index');
const errors = require('../../lib/errors');

class Node1 extends Node {
    log() {
        return Promise.resolve();
    }
};
const node = new Node1();

node.registerApiMethod({method: 'existing.method', fn: function() {}});
node.registerApiMethod({method: 'existing2.method2', fn: function() {}});
node.registerApiMethod({method: 'existing2.method2.out', fn: function() {}});
node.registerApiMethod({method: 'existing2.method2.in', fn: function() {}});
node.registerExternalMethod({method: 'ext2', fn: function() {}});

tap.test('findMethod', (t) => {
    t.throws(() => node.findApiMethod({method: 'abc'}), errors.methodNotFound, 'API: should return error method not found error');
    t.type(node.findApiMethod({method: 'existing.method'}), 'function', 'API: should return method');
    t.type(node.findApiMethod({method: 'existing2.method2'}), 'function', 'API: should return method.out');
    t.type(node.findApiMethod({method: 'existing2.method2', direction: 'in'}), 'function', 'API: should return method.in');

    t.type(node.findExternalMethod({method: 'ext2'}), 'function', 'EXTERNAL: should return ext2');
    t.throws(() => node.findExternalMethod({method: 'ext3'}), errors.methodNotFound, 'EXTERNAL: should return error method not found error');
    t.end();
});
