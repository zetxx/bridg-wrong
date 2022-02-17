const tap = require('tap');
const Bridge = require('../../../lib/bridge');

tap.test('Multi', (l0) => {
    const A = Bridge({config: {id: 'A', request: {waitTime: 200000000}}});
    const B = Bridge({config: {id: 'B', request: {waitTime: 200000000}}});

    A.intersect({other: B});
    B.intersect({other: A});

    A.methods.add({
        method: 'a.in',
        fn: ({payload, error}) => {
            if (error) {
                throw error;
            }
            return payload + 1;
        }
    });

    B.methods.add({
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
    // instance eg. A or B
    // R^ - response
    // match, add - request operations
    l0.test('R->A.a.in->B.a.out->wait :: B.a.in->match->A.a.out->R^', async(l1) => {

        // R->A.a.in->B.a.out->wait
        await A.pass({
            packet: {
                payload: 3,
                meta: {method: 'a'}
            },
            direction: 'in'
        });

        setTimeout(async() => {
            // B.a.in->match->A.a.out->R^
            await B.pass({
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
