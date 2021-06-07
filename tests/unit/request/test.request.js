const tap = require('tap');
const {
    NotFound,
    WaitTimeExpired
} = require('../../../lib/request/errors');

const nodeId0 = Symbol('nodeId.0');
const defaultWaitTime = 1000;
const requests = require('../../../lib/request')({
    config: {
        waitTime: defaultWaitTime,
        debug: false
    },
    nodeId: nodeId0
});

let idx = 0;
const nodeId1 = Symbol('nodeId.1');

tap.test('Request', async(t) => {
    t.type(requests, 'object', 'request Is object');
    t.type(requests.add, 'function', 'request.add is function');
    t.type(requests.find, 'function', 'request.find is function');
    t.type(requests.fulfill, 'function', 'request.call is function');
    t.type(requests.fulfill, 'function', 'request.call is function');
    const rc = requests.add({
        onLocalReject: (e) => e,
        match: {idx: ++idx, nodeId: nodeId1}
    });
    t.same(rc.idx > 0, true, 'index should be greater than 0');
    t.same(rc.config, {waitTime: defaultWaitTime}, 'config should match');
    t.same(rc.nodeId, nodeId0, 'node-id should match');
    t.same(rc.nodeId, nodeId0, 'node-id should match');
    t.same(rc.promise instanceof Promise, true, 'should be instance of promise');
    t.type(rc.resolve, 'function', 'resole should be function');
    t.type(rc.reject, 'function', 'reject should be function');
    t.type(rc.timeout, 'object', 'timeout should be function');
    t.test('Request.Timeout', (tt) => {
        const rc2 = requests.add({
            onLocalReject: ({error}) => {
                tt.same(rc2.config, {waitTime: 550}, 'config should match');
                tt.same(error, new WaitTimeExpired(), 'should be expire time error');
                tt.end();
            },
            match: {idx: ++idx, nodeId: nodeId1},
            packet: {
                meta: {
                    config: {
                        waitTime: 550
                    }
                }
            }
        });
    });

    requests.find({meta: {idx: rc.idx}});
    t.type(
        requests.find({meta: {idx: rc.idx}}),
        'object',
        'should find request'
    );
    t.type(
        requests.find({meta: {idx: rc.idx, nodeId: nodeId0}}),
        'object',
        'should find request'
    );
    t.type(
        requests.find({meta: {idx: -1}}),
        'undefined',
        'should not find request'
    );
    t.type(
        requests.find({meta: {idx: rc.idx, nodeId: 'nomatch'}}),
        'undefined',
        'should not find request'
    );
    t.throws(() => requests.fulfill({}), new NotFound(), 'should trow');
    const fn1 = requests.fulfill(rc);
    t.type(
        fn1,
        'function',
        'should return function'
    );
    fn1({a: 2});
    t.same(await rc.promise, {a: 2}, 'should be same');
    t.end();
});

