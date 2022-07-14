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
    l0.same(v1.ctx(), {}, 'should return empty object, context is empty');
    l0.same(v1.ctx({a: 1}), {a: 1}, 'should return {a: 1}, first value that is set');
    l0.same(v1.ctx({b: 2}), {a: 1, b: 2}, 'should return {a: 1, b: 2}, second value that is set, first should be there');
    l0.same(v1.ctx({a: 6, b: 6}), {a: 6, b: 6}, 'should return {a: 6, b: 6}, overwrite both values');
    l0.same(v1.ctx({b: 5}), {a: 6, b: 5}, 'should return {a: 6, b: 5}, owerwrite only sec. value');
    l0.same(v1.ctx(), {a: 6, b: 5}, 'should return {a: 6, b: 5}, no args when fn call, return what is it in');
    v1.destroy();
    l0.end();
});

