const tap = require('tap');
const method = require('../../../lib/method')();
const {NotFound} = require('../../../lib/method/errors');

tap.test('Method', (t) => {
    t.type(method, 'object', 'method Is object');
    t.type(method.add, 'function', 'method.add is function');
    t.type(method.find, 'function', 'method.find is function');
    t.type(method.call, 'function', 'method.call is function');
    method.add('in.abc', () => 1);
    method.add('in.async.abc', async() => 1);
    t.throws(
        () => method.find({direction: 'in', packet: {meta: {method: 'abcd'}}}),
        new NotFound('method: abcd not found'),
        'should throw'
    );
    t.end();
});

