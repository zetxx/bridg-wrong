const tap = require('tap');
const {
    passFactory,
    timeOut,
    vectorFactory,
    methodRegisterFactory
} = require('./helpers');

tap.test('Vector: Simple checks and coverage', (l0) => {
    const v1 = vectorFactory({config: {id: 'V'}});
    v1.destroy();
    l0.end();
});

