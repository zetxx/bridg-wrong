const tap = require('tap');
const methods = require('../../../lib/methods')();
const {NotFound} = require('../../../lib/methods/errors');

tap.test('Method', (t) => {
    t.type(methods, 'object', 'method Is object');
    t.type(methods.add, 'function', 'method.add is function');
    t.type(methods.find, 'function', 'method.find is function');
    t.type(methods.call, 'function', 'method.call is function');
    methods.add({method: 'abc.in', fn: () => 1});
    
    t.throws(
        () => methods.find(),
        new NotFound('method: undefined not found'),
        'should throw'
    );

    t.throws(
        () => methods.find({direction: 'in', packet: {meta: {method: 'abcd'}}}),
        new NotFound('method: abcd not found'),
        'should throw'
    );

    t.rejects(
        methods.call({direction: 'in', packet: {meta: {method: 'abcd'}}}),
        new NotFound('method: abcd not found'),
        'should throw'
    );
    t.throws(
        () => methods.find({direction: 'in', packet: {meta: {method: 'abcd'}}}),
        new NotFound('method: abcd not found'),
        'should throw'
    );

    t.type(
        methods.find({direction: 'in', packet: {meta: {method: 'abc'}}}),
        'function',
        'method.find should returns function'
    );

    t.resolves(
        methods.call({direction: 'in', packet: {meta: {method: 'abc'}}}),
        'should resolves'
    );

    t.resolveMatch(
        methods.call({direction: 'in', packet: {meta: {method: 'abc'}}}),
        1,
        'should resolves to value'
    );
    t.end();
});

