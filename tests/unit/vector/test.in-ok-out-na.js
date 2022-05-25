const tap = require('tap');
const {
    passFactory,
    timeOut,
    vectorFactory,
    methodRegisterFactory
} = require('./helpers');

const v1 = vectorFactory({config: {id: 'V'}});
methodRegisterFactory(v1, 'a.in');
methodRegisterFactory(v1, 'a.out');

tap.test('Vector: Out Method don\'t exists', async(l0) => {
    try {
        const r1 = await passFactory(
            v1,
            ['UnExisting Method aa.in existing a.out'],
            false,
            ['a', 'in']
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
            const {packet} = await r1.request.promise;
            l0.equal(p2, packet, 'in and out should hold same requests');
        }, 1000);
        const {packet} = await r1.request.promise;
        await p;
    } catch (e) {
        console.error(e);
    } finally {
        v1.destroy();
        l0.end();
    }
});

