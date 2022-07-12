const tap = require('tap');
const Vector = require('../../../lib/vector');
const {
    timeOut,
    vectorFactory,
    methodRegisterFactory
} = require('../helpers');

tap.test('Vector: Simple checks and coverage', async(l0) => {
    Vector();
    const v1 = vectorFactory({config: {id: 'V', request: {waitTime: 3000}}});
    l0.resolves(v1.start(), 'start should resolves');
    v1.destroy();
    l0.end();
});

