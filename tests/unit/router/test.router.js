const tap = require('tap');
const Vector = require('../../../lib/vector');
const Router = require('../../../lib/router');

const log = (level, message) => {};

tap.test('Router', (l0) => {
    const router = Router({
        log,
        vectors: [Vector({
            log,
            config: {
                request: {waitTime: 5000},
                id: 'v1'
            }
        }), Vector({
            log,
            config: {
                request: {waitTime: 10000},
                id: 'v2'
            }
        })]
    });

    l0.end();
});
