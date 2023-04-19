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

tap.test('Vector: Timeouts', async(l0) => {
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
