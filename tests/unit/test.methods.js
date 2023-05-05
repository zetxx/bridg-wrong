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
    methods.add({method: 'abc', fn: () => 1});
    
    // t.throws(
    //     () => methods.find(),
    //     NotFound.create(
    //         'method: {method} not found',
    //         {method: undefined}
    //     ),
    //     'should throw'
    // );

    t.throws(
        () => methods.find('abcd'),
        NotFound.create(
            'method: {method} not found',
            {method: 'abcd'}
        ),
        'should throw'
    );

    t.rejects(
        methods.call({
            ctx: {
                header: {
                    method: 'abcd'
                }
            },
            method: 'abcd'
        }),
        NotFound.create(
            'method: {method} not found',
            {method: 'abcd'}
        ),
        'should throw'
    );
    t.throws(
        () => methods.find('abcd'),
        NotFound.create(
            'method: {method} not found',
            {method: 'abcd'}
        ),
        'should throw'
    );

    t.type(
        methods.find('abc'),
        'function',
        'method.find should returns function'
    );

    t.resolves(
        methods.call({
            ctx: {
                header: {
                    method: 'abc'
                }
            },
            method: 'abc'
        }),
        'should resolves'
    );

    t.resolveMatch(
        methods.call({
            ctx: {
                header: {
                    method: 'abc'
                }
            },
            method: 'abc'
        }),
        1,
        'should resolves to value'
    );
    t.end();
});

