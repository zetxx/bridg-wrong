const tap = require('tap');
const Node = require('../../index');

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
    t.rejects(node.findApiMethod({method: 'abc'}), 'API: should return error method not found error');
    t.resolves(node.findApiMethod({method: 'existing.method'}), 'API: should return method');
    t.resolves(node.findApiMethod({method: 'existing2.method2'}), 'API: should return method.out');
    t.resolves(node.findApiMethod({method: 'existing2.method2', direction: 'in'}), 'API: should return method.in');

    t.resolves(node.findExternalMethod({method: 'ext2'}), 'EXTERNAL: should return ext2');
    t.rejects(node.findExternalMethod({method: 'ext3'}), 'EXTERNAL: should return error method not found error');
    t.end();
});
