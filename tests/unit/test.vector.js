const tap = require('tap');
const Vector = require('../../lib/vector');

const vectorFactory = ({
    log = (level, msg) => console[level](msg),
    config: {
        request: {
            waitTime = 5000
        } = {},
        id
    } = {}
} = {}) => Vector({
    log,
    config: {
        request: {
            waitTime
        },
        id
    }
});

tap.test('Vector', (l0) => {
    l0.test('Simple checks and coverage', (t) => {
        const v1 = vectorFactory({config: {id: Symbol('V')}});
        v1.destroy();
        t.end();
    });

    // l0.test('One Vector', (l1) => {
    //     const router = Router({
    //         config: {
    //             id: 'A',
    //             request: {
    //                 waitTime: 5000
    //             }
    //         }
    //     });
    //     router.methods.add({
    //         method: 'a.in',
    //         fn: ({payload, error}) => {
    //             if (error) {
    //                 throw error;
    //             }
    //             return payload + 1;
    //         }
    //     });
    //     router.methods.add({
    //         method: 'a.out',
    //         fn: ({payload, error}) => {
    //             return payload + 43;
    //         }
    //     });
    //     l1.test('outbound Direct Full fill after 100 ms', async(t) => {
    //         let request = await router.pass({
    //             packet: {
    //                 payload: 3,
    //                 meta: {
    //                     method: 'a',
    //                     direction: 'out'
    //                 }
    //             }
    //         });
    //         setTimeout(router.requests.fulfill(request), 100);
    //         t.resolves(request.promise, 'should resolve');
    //         t.end();
    //     });

    //     l1.test('outbound resolves with error', async(t) => {
    //         let requestOut = await router.pass({
    //             packet: {
    //                 payload: 3,
    //                 meta: {
    //                     method: 'a',
    //                     direction: 'out'
    //                 }
    //             }
    //         });
    //         t.rejects(requestOut.promise, 'should rejects with timeout');
    //         t.end();
    //     });

    //     l1.test('outbound resolves/Rejects based on request meta.method', async(l2) => {
    //         l2.test('Resolve without method set', async(t) => {
    //             let requestOut = await router.pass({
    //                 packet: {
    //                     payload: 3,
    //                     meta: {
    //                         method: 'a',
    //                         direction: 'out'
    //                     }
    //                 }
    //             });
    //             const p = new Promise((resolve, reject) => {
    //                 setTimeout(async() => {
    //                     let requestIn = await router.pass({
    //                         packet: {
    //                             payload: 3,
    //                             meta: {
    //                                 idx: requestOut.idx,
    //                                 tag: requestOut.tag,
    //                                 direction: 'in'
    //                             }
    //                         }
    //                     });
    //                     try {
    //                         resolve(await requestIn.promise);
    //                     } catch (e) {
    //                         reject(e);
    //                     }
    //                 }, 100);
    //             });
    //             t.resolves(requestOut.promise, 'should resolve');
    //             t.resolves(p, 'should resolve');
    //             t.end();
    //         });

    //         l2.test('Resolve whit method set', async(t) => {
    //             let requestOut = await router.pass({
    //                 packet: {
    //                     payload: 3,
    //                     meta: {
    //                         method: 'a',
    //                         direction: 'out'
    //                     }
    //                 }
    //             });
    //             const p = new Promise((resolve, reject) => {
    //                 setTimeout(async() => {
    //                     let requestIn = await router.pass({
    //                         packet: {
    //                             payload: 3,
    //                             meta: {
    //                                 idx: requestOut.idx,
    //                                 tag: requestOut.tag,
    //                                 method: 'a',
    //                                 direction: 'in'
    //                             }
    //                         }
    //                     });
    //                     try {
    //                         resolve(await requestIn.promise);
    //                     } catch (e) {
    //                         reject(e);
    //                     }
    //                 }, 100);
    //             });
    //             t.resolves(requestOut.promise, 'should resolve');
    //             t.resolves(p, 'should resolve');
    //             t.end();
    //         });

    //         l2.test('Rejects since incorrect method passed', async(t) => {
    //             let requestOut = await router.pass({
    //                 packet: {
    //                     payload: 3,
    //                     meta: {
    //                         method: 'a',
    //                         direction: 'out'
    //                     }
    //                 }
    //             });
    //             t.rejects(requestOut.promise, 'should rejects');
    //             const p = new Promise((resolve, reject) => {
    //                 setTimeout(async() => {
    //                     let requestIn = await router.pass({
    //                         packet: {
    //                             payload: 3,
    //                             meta: {
    //                                 idx: requestOut.idx,
    //                                 tag: requestOut.tag,
    //                                 method: 'ab',
    //                                 direction: 'in'
    //                             }
    //                         }
    //                     });
    //                     try {
    //                         resolve(await requestIn.promise);
    //                     } catch (e) {
    //                         reject(e);
    //                     }
    //                 }, 100);
    //             });
    //             t.rejects(p, 'should rejects');
    //             t.end();
    //         });
    //         l2.end();
    //     });

    //     l1.end();
    // });

    l0.end();
});

