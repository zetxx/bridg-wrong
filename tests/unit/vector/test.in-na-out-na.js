const tap = require('tap');
const {
    vectorFactory,
    methodRegisterFactory
} = require('../helpers');

const v1 = vectorFactory({config: {id: 'V'}});
methodRegisterFactory(v1, 'a.in');
methodRegisterFactory(v1, 'a.out');

methodRegisterFactory(v1, '*.in', ({payload, ...pass}) => {
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

tap.test('Vector: In and Out Method don\'t exists', async(l0) => {
    try {
        const r1 = await passFactory(
            v1,
            ['UnExisting Method aa.in existing a.out'],
            false,
            ['aa', 'in']
        );
        const p = timeOut(async() => {
            const r2 = await passFactory(
                v1,
                r1.payload,
                r1.error,
                ['aa', 'out'],
                {idx: r1.request.idx, tag: r1.request.tag}
            );
            const {packet: p2} = await r2.request.promise;
            const {packet: p1} = await r1.request.promise;
            l0.equal(p1, p2, 'in and out should hold same requests');
        }, 1000);
        await r1.request.promise;
        await p;
    } catch (e) {
        console.error(e);
    } finally {
        v1.destroy();
        l0.end();
    }
});

