const tap = require('tap');
const Router = require('../../../lib/router');
const {
    RouterErrorWireNotFound
} = require('../../../lib/router/errors');
const {
    wireFactory,
    methodRegisterFactory
} = require('../helpers');

const log = (level, msg) => console[level](msg)''

tap.test('Router', async(l0) => {
    const v1 = wireFactory({
        log,
        config: {
            packet: {waitTime: 5000},
            id: 'v1'
        }
    });
    const v2 = wireFactory({
        log,
        config: {
            packet: {waitTime: 10000},
            id: 'v2'
        }
    });

    const router = Router({
        log,
        wires: [v1, v2]
    });

    methodRegisterFactory(v1, 'a.in');
    methodRegisterFactory(v1, 'a.out');
    methodRegisterFactory(v2, 'a.in');
    methodRegisterFactory(v2, 'a.out');

    try {
        await router.pass({wire: NaN});
    } catch (e) {
        l0.match(e, RouterErrorWireNotFound({wire: NaN}), 'wire not found');
    }
    l0.end();
});
