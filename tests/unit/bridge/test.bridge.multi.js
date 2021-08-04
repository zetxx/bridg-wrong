const tap = require('tap');
const Bridge = require('../../../lib/bridge');

tap.test('Bridge simulations', (l0) => {
    const bridgeA = new Bridge({config: {id: 'bridgeA', request: {waitTime: 200000000}}});
    const bridgeB = new Bridge({config: {id: 'bridgeB', request: {waitTime: 200000000}}});

    bridgeA.join({other: bridgeB});
    bridgeB.join({other: bridgeA});

    bridgeA.method.add({
        method: 'a.in',
        fn: ({payload, error}) => {
            if (error) {
                throw error;
            }
            return payload + 1;
        }
    });

    bridgeB.method.add({
        method: 'a.out',
        fn: ({payload, error}) => {
            if (error) {
                throw error;
            }
            return payload + 1;
        }
    });
    // R - request
    // A.a.in means instance.method.direction
    // R^ - response
    // match, add - request operations
    l0.test('R->A.a.in->add->B.a.out->add->B.a.in->match->A.a.out->R^', async(l1) => {

        let request = await bridgeA.pass({
            packet: {
                payload: 3,
                meta: {method: 'a'}
            },
            direction: 'in'
        });

        setTimeout(async() => {
            await bridgeB.pass({
                packet: {
                    payload: 3,
                    meta: {idx: 1}
                },
                direction: 'in'
            });
        }, 10000);

        l1.end();
    });

    l0.end();
});
