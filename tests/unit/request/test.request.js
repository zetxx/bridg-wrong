const tap = require('tap');
const {
    NotFound,
    WaitTimeExpired
} = require('../../../lib/request/errors');

const nodeId0 = Symbol('nodeId.0');
const request = require('../../../lib/request')({
    config: {
        waitTime: 500,
        debug: false
    },
    nodeId: nodeId0
});

let idx = 0;
const nodeId1 = Symbol('nodeId.1');

tap.test('Request', (t) => {
    t.type(request, 'object', 'request Is object');
    t.type(request.create, 'function', 'request.add is function');
    t.type(request.add, 'function', 'request.add is function');
    t.type(request.find, 'function', 'request.find is function');
    t.type(request.fulfill, 'function', 'request.call is function');
    t.type(request.fulfill, 'function', 'request.call is function');
    const rc = request.create({
        onLocalReject: (e) => e,
        match: {idx: ++idx, nodeId: nodeId1}
    });
    t.same(rc.idx > 0, true, 'index should be greater than 0');
    t.same(rc.nodeId, nodeId0, 'node-id should match');
    t.same(rc.nodeId, nodeId0, 'node-id should match');
    t.same(rc.promise instanceof Promise, true, 'should be instance of promise');
    t.type(rc.resolve, 'function', 'resole should be function');
    t.type(rc.reject, 'function', 'reject should be function');
    t.type(rc.timeout, 'object', 'timeout should be function');
    t.test('Request.Timeout', (tt) => {
        request.create({
            onLocalReject: ({error}) => {
                tt.same(error, new WaitTimeExpired(), 'should be expire time error');
                tt.end();
            },
            match: {idx: ++idx, nodeId: nodeId1}
        });
    });

    t.end();
});

