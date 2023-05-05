const tap = require('tap');
const {
    wirePassFactory,
    timeOut,
    wireFactory,
    methodRegisterFactory
} = require('../helpers');

const v1 = wireFactory({config: {id: 'V'}});
methodRegisterFactory(v1, 'a.in');
methodRegisterFactory(v1, 'a.out');

tap.test('Wire: in/out ok', async(l0) => {
    try {
        const vr1 = wirePassFactory(
            v1,
            ['UnExisting Method aa.in existing a.out'],
            false,
            ['a', 'in']
        );
        const p = timeOut(async() => {
            const vr2 = wirePassFactory(
                v1,
                ['out'],
                false,
                ['a', 'out'],
                {idx: vr1.packet.header.idx, tag: vr1.packet.config.tag}
            );
            l0.same(vr2.packet, vr1.packet, 'returned packets should be same');
        }, 100);
        const res = await vr1.packet.promise;
        l0.same(res.payload, ['out', '>a.out', 'X:a.out'], 'result should match');
    } catch (e) {
        console.error(e);
    } finally {
        v1.destroy();
        l0.end();
    }
});

