const tap = require('tap');
const Bridge = require('../../../lib/bridge');

tap.test('Bridge', (l0) => {
    // l0.test('Simple checks and coverage', (t) => {
    //     const bridge = new Bridge();
    //     bridge.start({});
    //     bridge.destroy();
    //     t.end();
    // });

    l0.test('One Vector', (l1) => {
        const bridge = new Bridge({config: {id: 'bridgeA', request: {waitTime: 5000}}});
        bridge.method.add({
            method: 'a.in',
            fn: ({payload}) => payload + 1
        });
        bridge.method.add({
            method: 'a.out',
            fn: ({payload}) => payload + 43
        });
        // l1.test('outbound Direct Full fill after 100 ms', async(t) => {
        //     let request = await bridge.pass({
        //         packet: {
        //             payload: 3,
        //             meta: {method: 'a'}
        //         },
        //         direction: 'out'
        //     });
        //     setTimeout(bridge.request.fulfill(request), 100);
        //     t.resolves(request.promise, 'should resolve');
        //     t.end();
        // });

        l1.test('outbound resolves when correct inbound received', async(t) => {
            let requestOut = await bridge.pass({
                packet: {
                    payload: 3,
                    meta: {method: 'a'}
                },
                direction: 'out'
            });
            setTimeout(async() => {
                try {
                    let requestIn = await bridge.pass({
                        packet: {
                            payload: 3,
                            meta: {idx: requestOut.idx, nodeId: requestOut.nodeId}
                        },
                        direction: 'in'
                    });
                    await requestIn.promise;
                } catch (e) {
                    console.error(e);
                }
            }, 100);
            await requestOut.promise;
            t.end();
        });

        bridge.destroy();
        l1.end();
    });

    l0.end();
});

