const tap = require('tap');
const {
    NotFound,
    WaitTimeExpired,
    ForceDestroy
} = require('../../../lib/waiters/errors');

const nodeId0 = Symbol('nodeId.0');
const defaultWaitTime = 1000;
let idx = 0;
const nodeId1 = Symbol('nodeId.1');


tap.test('Waiter', async(t) => {
    const waiters1 = require('../../../lib/waiters')({
        config: {
            waitTime: defaultWaitTime
        },
        nodeId: nodeId0
    });
    // coverage
    require('../../../lib/waiters')();

    t.type(waiters1, 'object', 'waiter Is object');
    t.type(waiters1.len, 'function', 'waiter.len is function');
    t.equal(waiters1.len(), 0, '0 waiters');
    t.type(waiters1.add, 'function', 'waiter.add is function');
    t.type(waiters1.find, 'function', 'waiter.find is function');
    t.type(waiters1.fulfill, 'function', 'waiter.call is function');
    t.type(waiters1.fulfill, 'function', 'waiter.call is function');

    t.test('Waiter 1', async(tt) => {
        const rq = waiters1.add({
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
    
        waiters1.find({meta: {idx: rq.idx}});
        tt.type(
            waiters1.find(),
            'undefined',
            'should not find waiter'
        );
        tt.type(
            waiters1.find({}),
            'undefined',
            'should not find waiter'
        );
        tt.type(
            waiters1.find({meta: {}}),
            'undefined',
            'should not find waiter'
        );
        tt.type(
            waiters1.find({meta: {idx: rq.idx}}),
            'object',
            'should find waiter'
        );
        tt.type(
            waiters1.find({meta: {idx: rq.idx, nodeId: nodeId0}}),
            'object',
            'should find waiter'
        );
        tt.type(
            waiters1.find({meta: {idx: -1}}),
            'undefined',
            'should not find waiter'
        );
        tt.type(
            waiters1.find({meta: {idx: rq.idx, nodeId: 'nomatch'}}),
            'undefined',
            'should not find waiter'
        );
        tt.throws(() => waiters1.fulfill({}), NotFound.create(''), 'should trow');
        const fn1 = waiters1.fulfill(rq);
        tt.type(
            fn1,
            'function',
            'should return function'
        );
        fn1({a: 2});
        tt.same(await rq.promise, {a: 2}, 'should be same');
        tt.end();
    });
    
    t.test('Waiter 2 Timeout', (tt) => {
        const rq = waiters1.add({
            onLocalReject: ({error}) => {
                tt.same(rq.config, {waitTime: 550}, 'config should match');
                tt.same(error, WaitTimeExpired.create(''), 'should be expire time error');
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
 
    t.test('Waiter 3 resolve with error', (tt) => {
        const rq = waiters1.add({
            onLocalReject: (e) => e,
            match: {idx: ++idx, nodeId: nodeId1}
        });
        const errorMsg = {error: new Error()};
        const fn2 = waiters1.fulfill(rq);
        tt.rejects(rq.promise, errorMsg);
        fn2(errorMsg);
        tt.end();
    });

    t.test('Waiter 4', (tt) => {
        const rq = waiters1.add({
            onLocalReject: (e) => e,
            match: {idx: ++idx, nodeId: nodeId1}
        });
        const fn = waiters1.fulfill(rq);
        tt.equal(fn({}), undefined, 'should return void');
        tt.end();
    });

    t.test('Waiter 5', (tt) => {
        const rq = waiters1.add({
            onLocalReject: (e) => e,
            match: {idx: ++idx, nodeId: nodeId1}
        });
        const fn = waiters1.fulfill(rq);
        tt.equal(fn(), undefined, 'should return void');
        tt.end();
    });

    t.test('Waiter 6', (tt) => {
        const waiters2 = require('../../../lib/waiters')({nodeId: nodeId0});
        const rq = waiters2.add({
            onLocalReject: (e) => e,
            match: {idx: ++idx}
        });
        tt.rejects(rq.promise, {error: ForceDestroy.create('')}, 'should reject');
        waiters2.destroy();
        tt.end();
    });

    t.end();
});

