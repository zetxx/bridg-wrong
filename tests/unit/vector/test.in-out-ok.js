const tap = require('tap');
const {
    vectorPassFactory,
    timeOut,
    vectorFactory,
    methodRegisterFactory
} = require('../helpers');

const v1 = vectorFactory({config: {id: 'V'}});
methodRegisterFactory(v1, 'a.in');
methodRegisterFactory(v1, 'a.out');

tap.test('Vector: Existing Methods a.in and a.out', async(l0) => {
    try {
        const r1 = await vectorPassFactory(
            v1,
            ['Existing Methods a.in and a.out, dir in > out'],
             false,
            ['a','in']
        );
        setTimeout(async() => {
            await vectorPassFactory(
                v1,
                r1.payload,
                false,
                ['a', 'out'],
                {idx: r1.request.idx, tag: r1.request.tag}
            );
        }, 500);
        const {packet} = await r1.request.promise;
        l0.same(packet, {
            payload: [
                'Existing Methods a.in and a.out, dir in > out',
                '>a.in',
                'X:a.in',
                '>a.out',
                'X:a.out'
            ],
            meta: {method: 'a', direction: 'out'},
            match: {idx: 1, tag: Symbol('V')}
        }, 'packet struct should match, direction in > out');

        const r2 = await vectorPassFactory(
            v1,
            ['Existing Methods a.in and a.out, dir out > in'],
            false,
            ['a', 'out']
        );
        setTimeout(async() => {
            await vectorPassFactory(
                v1,
                r2.payload,
                false,
                ['a', 'in'],
                {idx: r2.request.idx, tag: r2.request.tag}
            );
        }, 500);
        const {packet: p2} = await r2.request.promise;
        l0.same(p2, {
            payload: [
                'Existing Methods a.in and a.out, dir out > in',
                '>a.out',
                'X:a.out',
                '>a.in',
                'X:a.in'
            ],
            meta: {method: 'a', direction: 'in'},
            match: {idx: 2, tag: Symbol('V')}
        }, 'packet struct should match, direction out > in');
    } catch (e) {
        console.error(e);
    } finally {
        v1.destroy();
        l0.end();
    }
});

