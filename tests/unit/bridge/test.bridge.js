const tap = require('tap');
const Bridge = require('../../../lib/bridge');

tap.test('Bridge', (l0) => {
    // l0.test('Simple checks and coverage', (t) => {
    //     const bridge = new Bridge();
    //     bridge.start({});
    //     bridge.destroy();
    //     t.end();
    // });

    l0.test('Method call positive cases', (t) => {
        // set up
        const bridgeA = new Bridge({config: {id: 'bridgeA'}});
        const bridgeB = new Bridge({config: {id: 'bridgeB'}});
        bridgeA.start({other: bridgeB});
        bridgeB.start({other: bridgeA});
        // register methods
        bridgeA.methods.add({method: 'a.in', fn: ({payload}) => {
            return payload;
        }});
        bridgeB.methods.add({method: 'a.out', fn: ({payload}) => {
            return payload;
        }});

        bridgeA.pass({direction: 'in', packet: {meta: {method: 'a'}, payload: {a: 1}}});
        t.end();
    });

    l0.end();
});

