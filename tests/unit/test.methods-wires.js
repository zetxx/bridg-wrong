const tap = require('tap');
const Methods = require('../../lib/methods');
const Wires = require('../../lib/wires');
const wires = Wires({});
let requests = new Map();
new (Methods({
    wires
})); // coverage
const methods1 = new (Methods({
    wires,
    list: requests,
    config: {namespace: 'testmethods'}
}));
const methods2 = new (Methods({
    wires,
    list: requests,
    config: {namespace: 'testmethods12'}
}));
const methods3 = new (Methods({
    wires,
    list: requests,
    config: {namespace: 'ethods12'}
}));
methods2.add({name: 'a.b.fn1', fn: (m) => 123});
methods2.add({name: 'a.b.fn.ask', fn: async(m, {ask}) => (await ask({method: 'a.b.fn3', meta: {timeout: 1000 * 30}})).params});
methods2.add({name: 'a.b.fn.notify', fn: async(m, {notify}) => await notify({method: 'a.b.fn3'})});
methods3.add({name: 'a.b.fn3', fn: (m) => 123});
methods3.add({name: 'a.b.fn2.throws', fn: (m) => {throw new Error('abc')}});
tap.test('Wires + Methods', async(t) => {
    try {
        await methods1.ask({id: 1, method: 'a1', params: [123]});
    } catch ({error}) {
        t.same(
            error.message,
            'NotFound',
            'method not found'
        );
    }
    try {
        const z = await methods1.notify({method: 'a1', params: [123]});
    } catch ({error}) {
        t.same(
            error.message,
            'NotFound',
            'method not found'
        );
    }
    let {params} = await methods1.ask({method: 'a.b.fn1', params: [123]});
    t.same(
        params,
        123,
        'check response'
    );
    let r = await methods1.notify({method: 'a.b.fn1', params: [123]});
    t.same(
        await methods1.notify({method: 'a.b.fn1', params: [123]}),
        true,
        'check response of notification'
    );
    r = await methods1.ask({method: 'a.b.fn.ask', params: [123], meta: {timeout: 1000 * 30}});
    t.same(
        r.params,
        123,
        'check response'
    );
    r = await methods1.notify({method: 'a.b.fn.notify', params: [123]});
    t.same(
        r,
        true,
        'check notify response'
    );
    try {
        r = await methods1.ask({method: 'a.b.fn2.throws', params: [123]});
    } catch ({error}) {
        t.same(
            error.message,
            'abc',
            'check throw in method'
        );
    }
    t.end();
});

