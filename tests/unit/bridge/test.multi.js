const tap = require('tap');
const Bridge = require('../../../lib/bridge');

tap.test('Multi', (l0) => {
    const bridgeA = Bridge({config: {id: 'bridgeA', request: {waitTime: 200000000}}});
    const bridgeB = Bridge({config: {id: 'bridgeB', request: {waitTime: 200000000}}});

    bridgeA.intersect({other: bridgeB});
    bridgeB.intersect({other: bridgeA});

    bridgeA.methods.add({
        method: 'a.in',
        fn: ({payload, error}) => {
            if (error) {
                throw error;
            }
            return payload + 1;
        }
    });

    bridgeB.methods.add({
        method: 'a.out',
        fn: ({payload, error}) => {
            if (error) {
                throw error;
            }
            return payload + 1;
        }
    });
    // R - request
    // A.a.in means instance.methods.direction,
    // instance eg. bridgeA or bridgeB
    // R^ - response
    // match, add - request operations
    l0.test('R->A.a.in->B.a.out->wait :: B.a.in->match->A.a.out->R^', async(l1) => {

        // R->A.a.in->B.a.out->wait
        await bridgeA.pass({
            packet: {
                payload: 3,
                meta: {method: 'a'}
            },
            direction: 'in'
        });

        setTimeout(async() => {
            // B.a.in->match->A.a.out->R^
            await bridgeB.pass({
                packet: {
                    payload: 3,
                    meta: {idx: 1}
                },
                direction: 'in'
            });
        }, 1000);

        l1.end();
    });

    l0.end();
});
