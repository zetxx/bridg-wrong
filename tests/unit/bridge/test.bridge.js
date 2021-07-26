const tap = require('tap');
const bridge = require('../../../lib/bridge');

tap.test('Bridge', (l1) => {
    l1.test('1', (t) => {
        t.end();
    });
    l1.end();
});

