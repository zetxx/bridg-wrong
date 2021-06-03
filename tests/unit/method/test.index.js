const tap = require('tap');
const method = require('../../../lib/method')();

tap.test('Method', (t) => {
    tap.type(method, 'object', 'method Is object');
    tap.type(method.add, 'function', 'method.add is function');
    tap.type(method.find, 'function', 'method.find is function');
    tap.type(method.call, 'function', 'method.call is function');
    t.end();
});

