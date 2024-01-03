const tap = require('tap');
const Methods = require('../../lib/methods');
const Wires = require('../../lib/wires');
const wires = Wires({});
let requests = new Map();
const methods1 = new (Methods({
    wires,
    list: requests,
    config: {timeout: 1000 * 60 * 100, namespace: 'testmethods'}
}));
const methods2 = new (Methods({
    wires,
    list: requests,
    config: {timeout: 1000 * 60 * 100, namespace: 'testmethods12'}
}));
methods2.add({name: 'a.b.fn1', fn: (m) => 123});
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
    t.end();
});

