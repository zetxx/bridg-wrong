const tap = require('tap');
const {Packets} = require('../../lib/packets');
const {
    NotFound,
    WaitTimeExpired,
    ForceDestroy
} = require('../../lib/packets/errors');

const tag0 = Symbol('tag.0');
const defaultWaitTime = 1000;
let idx = 0;
const tag1 = Symbol('tag.1');

tap.test('Packet', async(t) => {
    const packetPool = Packets({
        config: {
            waitTime: defaultWaitTime
        },
        tag: tag0
    });
    // coverage

    t.type(packetPool, 'object', 'packet Is object');
    t.type(
        packetPool.len,
        'function',
        'packet.len is function'
    );
    t.equal(packetPool.len(), 0, '0 packets');
    t.type(
        packetPool.add,
        'function',
        'packet.add is function'
    );
    t.type(
        packetPool.find,
        'function',
        'packet.find is function'
    );
    t.type(
        packetPool.fulfill,
        'function',
        'packet.call is function'
    );

    t.test('Packet 1', async(tt) => {
        const rq = packetPool.add({
            match: {idx: ++idx, tag: tag1},
            header: {trace: -1}
        });
        tt.same(
            rq.header.idx > 0,
            true,
            'index should be greater than 0'
        );
        tt.same(
            rq.header.trace,
            -1,
            'trace id should be same as passed'
        );
        tt.same(
            rq.config,
            {waitTime: defaultWaitTime, tag: tag0},
            'config should match'
        );
        tt.same(
            rq.state.current instanceof Promise,
            true,
            'should be instance of promise'
        );
        tt.type(
            rq.state.resolve,
            'function',
            'resole should be function'
        );
        tt.type(
            rq.state.reject,
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

        packetPool.find({idx: rq.idx});
        tt.type(
            packetPool.find(),
            'undefined',
            'should not find packet'
        );
        tt.type(
            packetPool.find({}),
            'undefined',
            'should not find packet'
        );
        tt.type(
            packetPool.find({idx: rq.header.idx}),
            'object',
            'should find packet'
        );
        tt.type(
            packetPool.find({idx: rq.header.idx, tag: tag0}),
            'object',
            'should find packet'
        );
        tt.type(
            packetPool.find({idx: -1}),
            'undefined',
            'should not find packet'
        );
        tt.type(
            packetPool.find({idx: rq.header.idx, tag: 'nomatch'}),
            'undefined',
            'should not find packet'
        );
        tt.throws(
            () => packetPool.fulfill({}),
            NotFound.create('NotFound', {tag: tag0}),
            'should trow NotFound'
        );
        const fn1 = packetPool.fulfill(rq);
        tt.type(
            fn1,
            'function',
            'should return function'
        );
        fn1({a: 2});
        tt.same(await rq.state.current, {a: 2}, 'should be same');
        tt.end();
    });

    t.test('Packet 2 Timeout', async(tt) => {
        const rq = packetPool.add({
            config: {
                waitTime: 550
            },
            match: {idx: ++idx, tag: tag1}
        });
        tt.same(
            rq.config,
            {waitTime: 550, tag: tag0},
            'config should match'
        );
        try {
            await rq.state.current;
        } catch (error) {
            tt.same(
                error,
                WaitTimeExpired.create(
                    'WaitTimeExpired',
                    {tag: tag0}
                ),
                'should be expire time error'
            );
            tt.end();
        }
    });

    t.test('Packet 3 resolve with error', (tt) => {
        const rq = packetPool.add({
            match: {idx: ++idx, tag: tag1}
        });
        const errorMsg = {error: new Error()};
        const fn2 = packetPool.fulfill(rq);
        tt.rejects(rq.state.current, errorMsg);
        fn2(errorMsg);
        tt.end();
    });

    t.test('Packet 4', (tt) => {
        const rq = packetPool.add({
            match: {idx: ++idx, tag: tag1}
        });
        const fn = packetPool.fulfill(rq);
        tt.equal(fn({}), undefined, 'should return void');
        tt.end();
    });

    t.test('Packet 5', (tt) => {
        const rq = packetPool.add({
            match: {idx: ++idx, tag: tag1}
        });
        const fn = packetPool.fulfill(rq);
        tt.equal(fn(), undefined, 'should return void');
        tt.end();
    });

    t.test('Packet 6', (tt) => {
        const packets2 = Packets(
            {tag: tag0}
        );
        const rq = packets2.add({
            match: {idx: ++idx}
        });
        tt.rejects(
            rq.state.current,
            {error: ForceDestroy.create('')},
            'should reject'
        );
        packets2.destroy();
        tt.end();
    });

    t.end();
});
