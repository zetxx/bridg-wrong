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

tap.test('Wire: in method not found', async(l0) => {
    try {
        const vr1 = wirePassFactory(
            v1,
            ['UnExisting Method aa.in existing a.out'],
            false,
            ['aa', 'in']
        );
        await vr1.packet.promise;
    } catch (e) {
        l0.same(e.error.message, 'method: aa.in not found', 'method aa.in not found');
    } finally {
        v1.destroy();
        l0.end();
    }
});

tap.test('Wire: out method not found', async(l0) => {
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
                ['abc'],
                false,
                ['aa', 'out'],
                {idx: vr1.packet.header.idx, tag: vr1.packet.config.tag}
            );
            l0.same(vr2.packet, vr1.packet, 'returned packets should be same');
        }, 1000);
        await vr1.packet.promise;
    } catch (e) {
        l0.same(e.error.message, 'method: aa.out not found', 'method aa.out not found');
    } finally {
        v1.destroy();
        l0.end();
    }
});
