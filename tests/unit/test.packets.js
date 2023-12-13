const tap = require('tap');
const {Packets, merge} = require('../../lib/packets');
const {
    NotFound,
    WaitTimeExpired,
    ForceDestroy
} = require('../../lib/packets/errors');
const Timeout = setTimeout(() => {}, 0).constructor;

const tag0 = Symbol('tag.0');
const defaultWaitTime = 1000;
let idx = 0;
const tag1 = Symbol('tag.1');

tap.test('Packets', async(t) => {
    const packetPool = Packets({
        config: {
            packet: {
                waitTime: defaultWaitTime,
            },
            tag: tag0
        }
    });

    // coverage
    t.type(
        merge,
        'function',
        'merge should be function'
    );
    t.same(
        merge([{}, {}]),
        {payload: undefined, header: {}, match: {}},
        'merge output'
    );
    t.same(
        merge([{}, {payload: 1}]),
        {payload: 1, header: {}, match: {}},
        'merge packet'
    );
    t.same(
        merge([{header: {a: 1}, match: {a: 1}}, {header: {a: 2}, match: {a: 2}, payload: 1}]),
        {payload: 1, header: {a: 2}, match: {a: 2}},
        'merge packet overwride'
    );
    t.same(
        merge([{header: {a: 1}, match: {a: 1}}, {header: {b: 2}, match: {b: 2}, payload: 1}]),
        {payload: 1, header: {a: 1, b: 2}, match: {a: 1, b: 2}},
        'merge packet new'
    );
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
        packetPool.acquire,
        'function',
        'packet.acquire is function'
    );
    t.type(
        packetPool.find,
        'function',
        'packet.find is function'
    );
    t.type(
        merge,
        'function',
        'merge is function'
    );
    t.type(
        packetPool.fulfill,
        'function',
        'packet.call is function'
    );
    const p1 = packetPool.add({
        match: {idx: -100, tag: tag1},
        header: {trace: [-1], match: {a: 1}}
    });
    const p2 = packetPool.add({
        config: {waitTime: 100000000},
        match: {idx: -100, tag: tag1},
        header: {trace: [-1]}
    });
    packetPool.fulfill(p1)({});
    packetPool.fulfill(p2)({});
    t.same(
        Object.keys(p1).sort(),
        ['config', 'header', 'match', 'state', 'timeout'],
        '"add" match object keys [config, header, match, state, timeout]'
    );
    t.same(
        p1.header,
        {trace: [-1, p1.header.idx], idx: 1, method: undefined, tag: tag0, match: {a: 1}},
        'header should match'
    );
    t.same(
        p1.config,
        {waitTime: defaultWaitTime},
        'config waitTime'
    );
    t.same(
        p2.config,
        {waitTime: 100000000},
        'config waitTime 100000000'
    );
    t.same(
        p1.match,
        undefined,
        'match should be undefined'
    );
    t.same(
        p1.state.current instanceof Promise,
        true,
        'should be instance of promise'
    );
    t.type(
        p1.state.resolve,
        'function',
        'resole should be function'
    );
    t.type(
        p1.state.reject,
        'function',
        'reject should be function'
    );
    t.same(
        p1.timeout instanceof Timeout,
        true,
        'timeout should be instance of Timeout'
    );
    t.test('Packet 1', async(tt) => {
        const rq = packetPool.add({
            match: {idx: ++idx, tag: tag1},
            header: {trace: [-1]}
        });

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
        const p3 = packetPool.add({
            config: {waitTime: 100000000},
            match: {idx: 200, tag: tag1},
            header: {trace: [-1]}
        });
        const m1 = packetPool.acquire({payload: 1, header: {}, match: {idx: p3.header.idx, tag: tag0}});
        const m2 = packetPool.acquire({payload: 1, header: {}, match: {idx: p3.header.idx, tag: tag1}});
        const m3 = packetPool.acquire({payload: 1, header: {idx: p3.header.idx, tag: tag1}});
        const m4 = packetPool.acquire({payload: 1, header: m1.packet.header});
        const m5 = packetPool.acquire({payload: 1, header: {...m1.packet.header, tag: tag1}});
        tt.same(
            m1.found,
            true,
            'm1 acquire {}.found should be true'
        );
        tt.same(
            m4.found,
            true,
            'm4 acquire {}.found should be true'
        );
        tt.same(
            m1.matched,
            true,
            'm1 acquire {}.matched should be true'
        );
        tt.same(
            m4.matched,
            false,
            'm4 acquire {}.matched should be true'
        );
        tt.type(
            m1.packet,
            'object',
            'acquire {}.packet should be object'
        );
        packetPool.fulfill(p3)({});
        tt.type(
            m2.packet,
            'object',
            'm2 acquire {}.packet should be object/new packet'
        );
        tt.same(
            m2.found || m2.matched,
            undefined,
            'm2 acquire {}.found, {}.matched should be undefined'
        );
        tt.type(
            m3.packet,
            'object',
            'm3 acquire {}.packet should be object/new packet'
        );
        tt.type(
            m5.packet,
            'object',
            'm5 acquire {}.packet should be object/new packet'
        );
        tt.same(
            m3.found || m3.matched,
            undefined,
            'm3 acquire {}.found, {}.matched should be undefined'
        );
        tt.same(
            m5.found || m5.matched,
            undefined,
            'm5 acquire {}.found, {}.matched should be undefined'
        );
        packetPool.fulfill(m2.packet)({});
        packetPool.fulfill(m3.packet)({});
        packetPool.fulfill(m5.packet)({});
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
            {waitTime: 550},
            'config should match'
        );
        try {
            await rq.state.current;
        } catch ({error}) {
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
