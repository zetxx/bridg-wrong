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

tap.test('Vector: in method not found', async(l0) => {
    try {
        const vr1 = vectorPassFactory(
            v1,
            ['UnExisting Method aa.in existing a.out'],
            false,
            ['aa', 'in']
        );
        await vr1.request.promise;
    } catch (e) {
        l0.same(e.error.message, 'method: aa.in not found', 'method aa.in not found');
    } finally {
        v1.destroy();
        l0.end();
    }
});

tap.test('Vector: out method not found', async(l0) => {
    try {
        const vr1 = vectorPassFactory(
            v1,
            ['UnExisting Method aa.in existing a.out'],
            false,
            ['a', 'in']
        );
        const p = timeOut(async() => {
            const vr2 = vectorPassFactory(
                v1,
                ['abc'],
                false,
                ['aa', 'out'],
                {idx: vr1.request.idx, tag: vr1.request.tag}
            );
            l0.same(vr2.request, vr1.request, 'returned requests should be same');
        }, 1000);
        await vr1.request.promise;
    } catch (e) {
        l0.same(e.error.message, 'method: aa.out not found', 'method aa.out not found');
    } finally {
        v1.destroy();
        l0.end();
    }
});

