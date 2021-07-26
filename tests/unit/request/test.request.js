const tap = require('tap');
const {
    NotFound,
    WaitTimeExpired
} = require('../../../lib/request/errors');

const nodeId0 = Symbol('nodeId.0');
const defaultWaitTime = 1000;
let idx = 0;
const nodeId1 = Symbol('nodeId.1');

tap.test('Request', async(t) => {

    const requests1 = require('../../../lib/request')({
        config: {
            waitTime: defaultWaitTime
        },
        nodeId: nodeId0
    });
    t.type(requests1, 'object', 'request Is object');
    t.type(requests1.add, 'function', 'request.add is function');
    t.type(requests1.find, 'function', 'request.find is function');
    t.type(requests1.fulfill, 'function', 'request.call is function');
    t.type(requests1.fulfill, 'function', 'request.call is function');
    const rc = requests1.add({
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

    requests1.find({meta: {idx: rc.idx}});
    t.type(
        requests1.find({meta: {idx: rc.idx}}),
        'object',
        'should find request'
    );
    t.type(
        requests1.find({meta: {idx: rc.idx, nodeId: nodeId0}}),
        'object',
        'should find request'
    );
    t.type(
        requests1.find({meta: {idx: -1}}),
        'undefined',
        'should not find request'
    );
    t.type(
        requests1.find({meta: {idx: rc.idx, nodeId: 'nomatch'}}),
        'undefined',
        'should not find request'
    );
    t.throws(() => requests1.fulfill(), new NotFound(), 'should trow');
    const fn1 = requests1.fulfill(rc);
    t.type(
        fn1,
        'function',
        'should return function'
    );
    fn1({a: 2});
    t.same(await rc.promise, {a: 2}, 'should be same');

    t.test('Request.Timeout', (tt) => {
        const rc2 = requests1.add({
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
 
    t.test('Request resolve with error', (tt) => {
        const rc3 = requests1.add({
            onLocalReject: (e) => e,
            match: {idx: ++idx, nodeId: nodeId1}
        });
        const errorMsg = {error: new Error()};
        const fn2 = requests1.fulfill(rc3);
        tt.rejects(rc3.promise, errorMsg);
        fn2(errorMsg);
        tt.end();
    });

    t.end();
});

