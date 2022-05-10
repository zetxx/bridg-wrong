const tap = require('tap');
const Vector = require('../../lib/vector');

const vectorFactory = ({
    log = (level, msg) => console[level](msg),
    config: {
        request: {
            waitTime = 1000000
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

const methodRegisterFactory = (vector, name) => {
    vector.methods.add({
        method: name,
        fn: ({payload, error}) => {
            if (error) {
                throw error;
            }
            return payload.concat([`X:${name}`]);
        }
    });
};

const passFactory = (
    vector,
    payload,
    error,
    m,
    match = {}
) => {
    const [method, direction] = m.split('.');
    return vector.pass({
        packet: {
            ...(payload && {payload: payload.concat([`>${m}`])}),
            ...(error && {error}),
            meta: {
                direction,
                method
            },
            match
        }
    });
};

tap.test('Vector', (l0) => {
    // l0.test('Simple checks and coverage', (t) => {
    //     const v1 = vectorFactory({config: {id: 'V'}});
    //     v1.destroy();
    //     t.end();
    // });

    l0.test('New Request', async(l1) => {
        const v1 = vectorFactory({config: {id: 'V'}});
        methodRegisterFactory(v1, 'a.in');
        methodRegisterFactory(v1, 'a.out');

        // l1.test('Existing Methods a.in and a.out', async(l2) => {
        //     try {
        //         const r1 = await passFactory(
        //             v1,
        //             ['Existing Methods a.in and a.out, dir in > out'],
        //              false,
        //             'a.in'
        //         );
        //         setTimeout(async() => {
        //             await passFactory(
        //                 v1,
        //                 r1.payload,
        //                 false,
        //                 'a.out',
        //                 {idx: r1.request.idx, tag: r1.request.tag}
        //             );
        //         }, 500);
        //         const {packet} = await r1.request.promise;
        //         l2.same(packet, {
        //             payload: [
        //                 'Existing Methods a.in and a.out, dir in > out',
        //                 '>a.in',
        //                 'X:a.in',
        //                 '>a.out',
        //                 'X:a.out'
        //             ],
        //             meta: {direction: 'out', method: 'a'},
        //             match: {idx: 1, tag: Symbol('V')}
        //         }, 'packet struct should match, direction in > out');

        //         const r2 = await passFactory(
        //             v1,
        //             ['Existing Methods a.in and a.out, dir out > in'],
        //             'a.out'
        //         );
        //         setTimeout(async() => {
        //             await passFactory(
        //                 v1,
        //                 r2.payload,
        //                 false,
        //                 'a.in',
        //                 {idx: r2.request.idx, tag: r2.request.tag}
        //             );
        //         }, 500);
        //         const {packet: p2} = await r2.request.promise;
        //         l2.same(p2, {
        //             payload: [
        //                 'Existing Methods a.in and a.out, dir out > in',
        //                 '>a.out',
        //                 'X:a.out',
        //                 '>a.in',
        //                 'X:a.in'
        //             ],
        //             meta: {direction: 'in', method: 'a'},
        //             match: {idx: 2, tag: Symbol('V')}
        //         }, 'packet struct should match, direction out > in');
        //    } catch (e) {
        //         console.error(e);
        //     } finally {
        //         v1.destroy();
        //         l2.end();
        //     }
        // });
        l1.test('In Method don\'t exists', async(l2) => {
            try {
                const r1 = await passFactory(
                    v1,
                    ['Existing Methods a.in and a.out'],
                    false,
                    'aa.in'
                );
                setTimeout(async() => {
                    await passFactory(
                        v1,
                        r1.payload,
                        r1.error,
                        'a.out',
                        {idx: r1.request.idx, tag: r1.request.tag}
                    );
                }, 1000);
                console.log(1)
                const {packet} = await r1.request.promise;
                console.log(packet)
            } catch (e) {
                console.error(e);
            } finally {
                v1.destroy();
                l2.end();
            }
        });
        // l1.test('Out Method dont exists', async(l2) => {
        //     try {
        //         const r1 = await passFactory(
        //             v1,
        //             ['Existing Methods a.in and a.out'],
        //             false,
        //             'a.in'
        //         );
        //         setTimeout(async() => {
        //             await passFactory(
        //                 v1,
        //                 r1.payload,
        //                 false,
        //                 'a.out',
        //                 {idx: r1.request.idx, tag: r1.request.tag}
        //             );
        //         }, 500);
        //         const res = await r1.request.promise;
        //         console.log(res);
        //     } catch (e) {
        //         console.error(e);
        //     } finally {
        //         v1.destroy();
        //         l2.end();
        //     }
        // });
        // l1.test('In and Out Method dont exists', async(l2) => {
        //     try {
        //         const r1 = await passFactory(
        //             v1,
        //             ['Existing Methods a.in and a.out'],
        //             false,
        //             'a.in'
        //         );
        //         setTimeout(async() => {
        //             await passFactory(
        //                 v1,
        //                 r1.payload,
        //                 false,
        //                 'a.out',
        //                 {idx: r1.request.idx, tag: r1.request.tag}
        //             );
        //         }, 500);
        //         const res = await r1.request.promise;
        //         console.log(res);
        //     } catch (e) {
        //         console.error(e);
        //     } finally {
        //         v1.destroy();
        //         l2.end();
        //     }
        // });
        l1.end();
    });

    // l0.test('Existing Request', (t) => {
    //     const v1 = vectorFactory({config: {id: 'V'}});
    //     v1.pass({
    //         packet: {
    //             payload: ['init'],
    //             meta: {
    //                 direction: 'in',
    //                 method: 'a'
    //             }
    //         }
    //     });
    //     v1.destroy();
    //     t.end();
    // });

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

