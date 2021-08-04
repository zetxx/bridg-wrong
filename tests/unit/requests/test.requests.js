const tap = require('tap');
const {
    NotFound,
    WaitTimeExpired,
    ForceDestroy
} = require('../../../lib/requests/errors');

const nodeId0 = Symbol('nodeId.0');
const defaultWaitTime = 1000;
let idx = 0;
const nodeId1 = Symbol('nodeId.1');


tap.test('Request', async(t) => {
    const requests1 = require('../../../lib/requests')({
        config: {
            waitTime: defaultWaitTime
        },
        nodeId: nodeId0
    });
    // coverage
    require('../../../lib/requests')();

    t.type(requests1, 'object', 'request Is object');
    t.type(requests1.len, 'function', 'request.len is function');
    t.equal(requests1.len(), 0, '0 requests');
    t.type(requests1.add, 'function', 'request.add is function');
    t.type(requests1.find, 'function', 'request.find is function');
    t.type(requests1.fulfill, 'function', 'request.call is function');
    t.type(requests1.fulfill, 'function', 'request.call is function');

    t.test('Request 1', async(tt) => {
        const rq = requests1.add({
            onLocalReject: (e) => e,
            match: {idx: ++idx, nodeId: nodeId1}
        });
        tt.same(rq.idx > 0, true, 'index should be greater than 0');
        tt.same(rq.config, {waitTime: defaultWaitTime}, 'config should match');
        tt.same(rq.nodeId, nodeId0, 'node-id should match');
        tt.same(rq.nodeId, nodeId0, 'node-id should match');
        tt.same(rq.promise instanceof Promise, true, 'should be instance of promise');
        tt.type(rq.resolve, 'function', 'resole should be function');
        tt.type(rq.reject, 'function', 'reject should be function');
        tt.type(rq.timeout, 'object', 'timeout should be function');
    
        requests1.find({meta: {idx: rq.idx}});
        tt.type(
            requests1.find(),
            'undefined',
            'should not find request'
        );
        tt.type(
            requests1.find({}),
            'undefined',
            'should not find request'
        );
        tt.type(
            requests1.find({meta: {}}),
            'undefined',
            'should not find request'
        );
        tt.type(
            requests1.find({meta: {idx: rq.idx}}),
            'object',
            'should find request'
        );
        tt.type(
            requests1.find({meta: {idx: rq.idx, nodeId: nodeId0}}),
            'object',
            'should find request'
        );
        tt.type(
            requests1.find({meta: {idx: -1}}),
            'undefined',
            'should not find request'
        );
        tt.type(
            requests1.find({meta: {idx: rq.idx, nodeId: 'nomatch'}}),
            'undefined',
            'should not find request'
        );
        tt.throws(() => requests1.fulfill({}), new NotFound(), 'should trow');
        const fn1 = requests1.fulfill(rq);
        tt.type(
            fn1,
            'function',
            'should return function'
        );
        fn1({a: 2});
        tt.same(await rq.promise, {a: 2}, 'should be same');
        tt.end();
    });
    
    t.test('Request 2 Timeout', (tt) => {
        const rq = requests1.add({
            onLocalReject: ({error}) => {
                tt.same(rq.config, {waitTime: 550}, 'config should match');
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
 
    t.test('Request 3 resolve with error', (tt) => {
        const rq = requests1.add({
            onLocalReject: (e) => e,
            match: {idx: ++idx, nodeId: nodeId1}
        });
        const errorMsg = {error: new Error()};
        const fn2 = requests1.fulfill(rq);
        tt.rejects(rq.promise, errorMsg);
        fn2(errorMsg);
        tt.end();
    });

    t.test('Request 4', (tt) => {
        const rq = requests1.add({
            onLocalReject: (e) => e,
            match: {idx: ++idx, nodeId: nodeId1}
        });
        const fn = requests1.fulfill(rq);
        tt.equal(fn({}), undefined, 'should return void');
        tt.end();
    });

    t.test('Request 5', (tt) => {
        const rq = requests1.add({
            onLocalReject: (e) => e,
            match: {idx: ++idx, nodeId: nodeId1}
        });
        const fn = requests1.fulfill(rq);
        tt.equal(fn(), undefined, 'should return void');
        tt.end();
    });

    t.test('Request 6', (tt) => {
        const requests2 = require('../../../lib/requests')({nodeId: nodeId0});
        const rq = requests2.add({
            onLocalReject: (e) => e,
            match: {idx: ++idx}
        });
        tt.rejects(rq.promise, {error: new ForceDestroy()}, 'should reject');
        requests2.destroy();
        tt.end();
    });

    t.end();
});

