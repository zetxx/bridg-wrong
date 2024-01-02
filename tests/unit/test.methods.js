const tap = require('tap');
const Methods = require('../../lib/methods');
let requests = new Map();
const mockWires = {
    register(){},
    write(message, notFoundError){
        requests.set(`${message.id}.${message.method}`, {message, notFoundError});
    }
};
const methodsList = new Map();
const methods = new (Methods({
    wires: mockWires,
    list: methodsList,
    config: {timeout: 1000 * 60 * 100, namespace: 'testmethods'}
}));
tap.test('Method', async(t) => {
    t.same(
        methodsList.size,
        0,
        'methods list should be empty'
    );
    t.same(
        methods.responseMethodName({id: 'abc4'}),
        'testmethods.response.1.1.abc4',
        'response function method name'
    );
    t.same(
        methods.responseMethodName({id: 'abc4'}),
        'testmethods.response.1.2.abc4',
        'response function method name'
    );
    t.same(
        methods.log('info', {id: 'abc4'}),
        undefined,
        'log should return undefined'
    );
    const tmFnRet = Math.random();
    const fn1 = () => tmFnRet;
    t.same(
        methods.add({name: 'fn1', fn: fn1}),
        undefined,
        'add should return undefined'
    );
    t.same(
        methodsList.size,
        1,
        'methods list should be of len 1'
    );
    t.same(
        [...methodsList.keys()],
        ['fn1'],
        'methods, check names'
    );
    t.same(
        [...methodsList.values()],
        [{fn: fn1}],
        'methods, check values, function itself'
    );
    t.same(
        [...methodsList.values()][0].fn(),
        tmFnRet,
        'methods, check function returns'
    );
    t.same(
        methods.find({name: 'fn1'}).fn,
        fn1,
        'methods, check function'
    );
    t.same(
        methods.find({name: 'fn1'}).fn(),
        tmFnRet,
        'methods, check function returns'
    );
    t.same(
        methods.remove({name: 'fn1'}),
        undefined,
        'remove should return undefined'
    );
    t.same(
        methods.find({name: 'fn1'}),
        undefined,
        'find should return undefined'
    );
    methods.add({name: 'a1', fn: (message) => 123});
    const r = methods.send({id: 1, method: 'a1', params: [123]});
    const mk = [...methodsList.keys()];
    const idx = mk.findIndex((v) => v.indexOf('testmethods.response.') > -1);
    const m = methodsList.get(mk[idx]).fn;
    t.same(
        idx,
        1,
        'find response method'
    );
    const rE = methods.send({id: 1, method: 'a1', params: [123]});
    t.same(
        methodsList.size,
        3,
        'should have 3 methods'
    );
    m();
    t.same(
        methodsList.size,
        2,
        'should have 2 methods'
    );
    await t.resolves(r, {});
    const mkE = [...methodsList.keys()];
    const idxE = mk.findIndex((v) => v.indexOf('testmethods.response.') > -1);
    const mE = methodsList.get(mkE[idxE]).fn;
    mE({error: new Error('someError')});
    await t.rejects(rE, {});
    console.log(await rE);

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

