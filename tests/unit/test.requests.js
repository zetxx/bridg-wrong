const tap = require('tap');
const {
    NotFound,
    WaitTimeExpired,
    ForceDestroy
} = require('../../lib/requests/errors');

const tag0 = Symbol('tag.0');
const defaultWaitTime = 1000;
let idx = 0;
const tag1 = Symbol('tag.1');


tap.test('Request', async(t) => {
    const reqPool = require('../../lib/requests')({
        config: {
            waitTime: defaultWaitTime
        },
        tag: tag0
    });
    // coverage
    require('../../lib/requests')();

    t.type(reqPool, 'object', 'request Is object');
    t.type(
        reqPool.len,
        'function',
        'request.len is function'
    );
    t.equal(reqPool.len(), 0, '0 requests');
    t.type(
        reqPool.add,
        'function',
        'request.add is function'
    );
    t.type(
        reqPool.find,
        'function',
        'request.find is function'
    );
    t.type(
        reqPool.fulfill,
        'function',
        'request.call is function'
    );

    t.test('Request 1', async(tt) => {
        const rq = reqPool.add({
            // timeout: (e) => e,
            packet: {
                match: {idx: ++idx, tag: tag1},
                meta: {traceId: -1}
            }
        });
        tt.same(
            rq.idx > 0,
            true,
            'index should be greater than 0'
        );
        tt.same(
            rq.traceId,
            -1,
            'trace id should be same as passed'
        );
        tt.same(
            rq.config,
            {waitTime: defaultWaitTime},
            'config should match'
        );
        tt.same(rq.tag, tag0, 'tag should match');
        tt.same(rq.tag, tag0, 'tag should match');
        tt.same(
            rq.promise instanceof Promise,
            true,
            'should be instance of promise'
        );
        tt.type(
            rq.resolve,
            'function',
            'resole should be function'
        );
        tt.type(
            rq.reject,
            'function',
            'reject should be function'
        );
        tt.type(
            rq.timeout,
            'object',
            'timeout should be function'
        );

        tt.same(
            Object.keys(rq.match),
            ['idx', 'tag'],
            'match object should have keys: idx, tag'
        );
    
        reqPool.find({idx: rq.idx});
        tt.type(
            reqPool.find(),
            'undefined',
            'should not find request'
        );
        tt.type(
            reqPool.find({}),
            'undefined',
            'should not find request'
        );
        tt.type(
            reqPool.find({idx: rq.idx}),
            'object',
            'should find request'
        );
        tt.type(
            reqPool.find({idx: rq.idx, tag: tag0}),
            'object',
            'should find request'
        );
        tt.type(
            reqPool.find({idx: -1}),
            'undefined',
            'should not find request'
        );
        tt.type(
            reqPool.find({idx: rq.idx, tag: 'nomatch'}),
            'undefined',
            'should not find request'
        );
        tt.throws(
            () => reqPool.fulfill({}),
            NotFound.create('NotFound', {tag: tag0}),
            'should trow NotFound'
        );
        const fn1 = reqPool.fulfill(rq);
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
        const rq = reqPool.add({
            timeout: ({error}) => {
                tt.same(
                    rq.config,
                    {waitTime: 550},
                    'config should match'
                );
                tt.same(
                    error,
                    WaitTimeExpired.create(
                        'WaitTimeExpired',
                        {tag: tag0}
                    ),
                    'should be expire time error'
                );
                tt.end();
            },
            packet: {
                meta: {
                    config: {
                        waitTime: 550
                    }
                },
                match: {idx: ++idx, tag: tag1},
            }
        });
    });
 
    t.test('Request 3 resolve with error', (tt) => {
        const rq = reqPool.add({
            // timeout: (e) => e,
            packet: {match: {idx: ++idx, tag: tag1}}
        });
        const errorMsg = {error: new Error()};
        const fn2 = reqPool.fulfill(rq);
        tt.rejects(rq.promise, errorMsg);
        fn2(errorMsg);
        tt.end();
    });

    t.test('Request 4', (tt) => {
        const rq = reqPool.add({
            // timeout: (e) => e,
            packet: {match: {idx: ++idx, tag: tag1}}
        });
        const fn = reqPool.fulfill(rq);
        tt.equal(fn({}), undefined, 'should return void');
        tt.end();
    });

    t.test('Request 5', (tt) => {
        const rq = reqPool.add({
            // timeout: (e) => e,
            packet: {match: {idx: ++idx, tag: tag1}}
        });
        const fn = reqPool.fulfill(rq);
        tt.equal(fn(), undefined, 'should return void');
        tt.end();
    });

    t.test('Request 6', (tt) => {
        const requests2 = require('../../lib/requests')(
            {tag: tag0}
        );
        const rq = requests2.add({
            // timeout: (e) => e,
            match: {idx: ++idx}
        });
        tt.rejects(
            rq.promise,
            {error: ForceDestroy.create('')},
            'should reject'
        );
        requests2.destroy();
        tt.end();
    });

    t.end();
});

