const tap = require('tap');
const methods = require('../../lib/methods')({tag: Symbol()});
const {NotFound} = require('../../lib/methods/errors');

tap.test('Method', (t) => {
    t.type(methods, 'object', 'method Is object');
    t.type(
        methods.add,
        'function',
        'method.add is function'
    );
    t.type(
        methods.find,
        'function',
        'method.find is function'
    );
    t.type(
        methods.call,
        'function',
        'method.call is function'
    );
    methods.add({method: 'abc.in', fn: () => 1});
    
    t.throws(
        () => methods.find(),
        NotFound.create(
            'method: {method} not found',
            {method: 'undefined.undefined'}
        ),
        'should throw'
    );

    t.throws(
        () => methods.find({
            packet: {
                meta: {
                    direction: 'in',
                    method: 'abcd'
                }}
        }),
        NotFound.create(
            'method: {method} not found',
            {method: 'abcd.in'}
        ),
        'should throw'
    );

    t.rejects(
        methods.call({
            packet: {
                meta: {
                    direction: 'in',
                    method: 'abcd'
                }
            }
        }),
        NotFound.create(
            'method: {method} not found',
            {method: 'abcd.in'}
        ),
        'should throw'
    );
    t.throws(
        () => methods.find({
            packet: {
                meta: {
                    direction: 'in',
                    method: 'abcd'
                }
            }
        }),
        NotFound.create(
            'method: {method} not found',
            {method: 'abcd.in'}
        ),
        'should throw'
    );

    t.type(
        methods.find({
            packet: {
                meta: {
                    direction: 'in',
                    method: 'abc'
                }
            }
        }),
        'function',
        'method.find should returns function'
    );

    t.resolves(
        methods.call({
            packet: {
                meta: {
                    direction: 'in',
                    method: 'abc'
                }
            }
        }),
        'should resolves'
    );

    t.resolveMatch(
        methods.call({
            packet: {
                meta: {
                    direction: 'in',
                    method: 'abc'
                }
            }
        }),
        1,
        'should resolves to value'
    );
    t.end();
});

