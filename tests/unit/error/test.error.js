const tap = require('tap');
const CustomError = require('../../../lib/error');

const A = CustomError({code: 'A', message: 'msg-a'});
const B = CustomError({code: 'B', parent: A, message: 'msg-b'});

tap.test('Error', (t) => {
    t.type(CustomError, 'function', 'should be function');
    t.type(A, 'function', 'should be function');
    t.type(B, 'function', 'should be function');
    const a1 = new A();
    const a2 = new A('msg-a-2');
    const a3 = new A('msg-a-3', {state: {a: 3}});
    const b1 = new B();
    t.equal(a1.message, 'msg-a', 'message should match');
    t.equal(a1.state, null, 'state should be null');
    t.equal(a2.message, 'msg-a-2', 'message should match');
    t.equal(a3.message, 'msg-a-3', 'message should match');
    t.same(a3.state, {a: 3}, 'state should match');
    t.equal(a1.code, 'A', 'code should match');
    t.equal(b1.code, 'A.B', 'code should match');
    t.end();
});

