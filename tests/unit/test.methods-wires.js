const tap = require('tap');
const Methods = require('../../lib/methods');
const Wires = require('../../lib/wires');
const wires = Wires({});
let requests = new Map();
const methods = new (Methods({
    wires,
    config: {timeout: 1000 * 60 * 100, namespace: 'testmethods'}
}));
tap.test('Method', async(t) => {
    try {
        await methods.ask({id: 1, method: 'a1', params: [123]});
        console.log(123);
    } catch ({error}) {
        t.same(
            error.message,
            'NotFound',
            'method not found'
        );
    }
    t.end();
});

