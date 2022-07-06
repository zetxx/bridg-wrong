const tap = require('tap');
const Router = require('../../../lib/router');
const {
    RouterErrorRouteNotFound
} = require('../../../lib/router/errors');
const {
    routerPassFactory,
    timeOut,
    vectorFactory,
    methodRegisterFactory
} = require('../helpers');

const log = (level, msg) => console[level](msg)

tap.test('Router', async(l0) => {
    const v1 = vectorFactory({
        log,
        config: {
            request: {waitTime: 5000},
            id: 'v1'
        }
    });
    const v2 = vectorFactory({
        log,
        config: {
            request: {waitTime: 10000},
            id: 'v2'
        }
    });
    methodRegisterFactory(v1, 'a.in');
    methodRegisterFactory(v1, 'a.out');
    methodRegisterFactory(v2, 'a.in');
    methodRegisterFactory(v2, 'a.out');

    const router = Router({
        log,
        vectors: [v1, v2]
    });

    try {
        await router.pass({vector: 5});
    } catch (e) {
        l0.match(e, RouterErrorRouteNotFound({vector: 5}), 'route not found');
    }
    l0.end();
});
