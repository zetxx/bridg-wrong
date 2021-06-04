const tap = require('tap');
const request = require('../../../lib/request')({
    config: {debug: false}
});
const {NotFound} = require('../../../lib/request/errors');

tap.test('Request', (t) => {
    t.type(request, 'object', 'request Is object');
    t.type(request.add, 'function', 'request.add is function');
    t.type(request.create, 'function', 'request.add is function');
    t.type(request.find, 'function', 'request.find is function');
    t.type(request.fulfill, 'function', 'request.call is function');
    t.end();
});

