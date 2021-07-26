const tap = require('tap');
const method = require('../../../lib/methods')();
const {NotFound} = require('../../../lib/methods/errors');

tap.test('Method', (t) => {
    t.type(method, 'object', 'method Is object');
    t.type(method.add, 'function', 'method.add is function');
    t.type(method.find, 'function', 'method.find is function');
    t.type(method.call, 'function', 'method.call is function');
    method.add({method: 'abc.in', fn: () => 1});
    
    t.throws(
        () => method.find(),
        new NotFound('method: undefined not found'),
        'should throw'
    );

    t.throws(
        () => method.find({direction: 'in', packet: {meta: {method: 'abcd'}}}),
        new NotFound('method: abcd not found'),
        'should throw'
    );

    t.rejects(
        method.call({direction: 'in', packet: {meta: {method: 'abcd'}}}),
        new NotFound('method: abcd not found'),
        'should throw'
    );
    t.throws(
        () => method.find({direction: 'in', packet: {meta: {method: 'abcd'}}}),
        new NotFound('method: abcd not found'),
        'should throw'
    );

    t.type(
        method.find({direction: 'in', packet: {meta: {method: 'abc'}}}),
        'function',
        'method.find should returns function'
    );

    t.resolves(
        method.call({direction: 'in', packet: {meta: {method: 'abc'}}}),
        'should resolves'
    );

    t.resolveMatch(
        method.call({direction: 'in', packet: {meta: {method: 'abc'}}}),
        1,
        'should resolves to value'
    );
    t.end();
});

