const tap = require('tap');
const Methods = require('../../lib/methods');
const mockWires = {
    register(){},
    write(){}
};
const methods = new (Methods({
    wires: mockWires
}));
tap.test('Method', (t) => {
    t.same(
        methods.responseMethodName({id: 'abc4'}),
        '1.1.abc4',
        'response function method name'
    );
    t.same(
        methods.responseMethodName({id: 'abc4'}),
        '1.2.abc4',
        'response function method name'
    );
    methods;

    // t.type(methods, 'object', 'method Is object');
    
    // t.throws(
    //     () => methods.find(),
    //     NotFound.create(
    //         'method: {method} not found',
    //         {method: ''}
    //     ),
    //     'should throw'
    // );
    t.end();
});

