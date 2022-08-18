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
methodRegisterFactory(v1, 'throw.in');
methodRegisterFactory(v1, 'throw.out');
methodRegisterFactory(v1, '*.in', ({payload, ...pass}) => {
    if (pass.meta.method === 'throw') {
        throw new Error('test');
    }
    return {
        ...pass,
        payload: payload.concat(['*.in'])
    };
});
methodRegisterFactory(v1, '*.out', ({payload, ...pass}) => {
    return {
        ...pass,
        payload: payload.concat(['*.out'])
    };
});

const w1 = vectorFactory({config: {id: 'W'}});
methodRegisterFactory(w1, 'a.in');
methodRegisterFactory(w1, 'a.out');

tap.test('Vector: Special method (*) success cases', async(l0) => {
    try {
        // const r1 = await vectorPassFactory(
        //     v1,
        //     ['Existing Methods a.in and a.out, dir in > out, special(*) method should be called'],
        //      false,
        //     ['a', 'in']
        // );
        // setTimeout(async() => {
        //     await vectorPassFactory(
        //         v1,
        //         r1.payload,
        //         false,
        //         ['a', 'out'],
        //         {idx: r1.request.idx, tag: r1.request.tag}
        //     );
        // }, 500);
        // const {packet} = await r1.request.promise;
        // l0.same(packet, {
        //     payload: [
        //         'Existing Methods a.in and a.out, dir in > out, special(*) method should be called',
        //         '>a.in',
        //         'X:a.in',
        //         '>a.out',
        //         'X:a.out'
        //     ],
        //     meta: {method: 'a', direction: 'out'},
        //     match: {idx: 1, tag: Symbol('V')}
        // }, 'packet struct should match, direction in > out');
        // //////////////////////////////////
        // const r2 = await vectorPassFactory(
        //     w1,
        //     ['Existing Methods a.in and a.out, dir in > out, special(*) method called should be skipped'],
        //      false,
        //     ['a', 'in']
        // );
        // setTimeout(async() => {
        //     await vectorPassFactory(
        //         w1,
        //         r2.payload,
        //         false,
        //         ['a', 'out'],
        //         {idx: r2.request.idx, tag: r2.request.tag}
        //     );
        // }, 500);
        // const p2 = await r2.request.promise;
        // l0.same(p2.packet, {
        //     payload: [
        //         'Existing Methods a.in and a.out, dir in > out, special(*) method called should be skipped',
        //         '>a.in',
        //         'X:a.in',
        //         '>a.out',
        //         'X:a.out'
        //     ],
        //     meta: {method: 'a', direction: 'out'},
        //     match: {idx: 1, tag: Symbol('W')}
        // }, 'packet struct should match, direction in > out');
        //////////////////////////////////
        const r3 = await vectorPassFactory(
            v1,
            ['Existing Methods throw.in and throw.out, dir in > out, special(*) method called should be skipped'],
             false,
            ['throw', 'in']
        );
        setTimeout(async() => {
            await vectorPassFactory(
                v1,
                r3.payload,
                false,
                ['throw', 'out'],
                {idx: r3.request.idx, tag: r3.request.tag}
            );
        }, 500);
        const p3 = await r3.request.promise;
        l0.same(p3.packet, {
            payload: [
                'Existing Methods throw.in and throw.out, dir in > out, special(*) method called should be skipped',
                '>throw.in',
                'X:throw.in',
                '>throw.out',
                'X:throw.out'
            ],
            meta: {method: 'throw', direction: 'out'},
            match: {idx: 2, tag: Symbol('V')}
        }, 'packet struct should match, direction in > out');
    } catch (e) {
        console.error(e);
    } finally {
        v1.destroy();
        l0.end();
    }
});
