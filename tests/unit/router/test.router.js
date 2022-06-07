const tap = require('tap');
const Router = require('../../../lib/router');
const {
    routerPassFactory,
    timeOut,
    vectorFactory,
    methodRegisterFactory
} = require('../helpers');

const log = (level, msg) => console[level](msg)

tap.test('Router', (l0) => {
    const router = Router({
        log,
        vectors: [vectorFactory({
            log,
            config: {
                request: {waitTime: 5000},
                id: 'v1'
            }
        }), vectorFactory({
            log,
            config: {
                request: {waitTime: 10000},
                id: 'v2'
            }
        })]
    });

    router.pass({
        vector: 0,
        packet: 
    })

    l0.end();
});
