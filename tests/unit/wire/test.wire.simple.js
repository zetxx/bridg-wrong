const tap = require('tap');
const {
    wireFactory
} = require('../helpers');

const wf1 = wireFactory({
    config: {id: 'w1'}
});
wf1.methodRegisterFactory({
    name: 'a',
    fn: async(a) => {
        return a.payload.concat(['>a<']);
    }
});
tap.test('Wire', async(l0) => {
    wireFactory({});
    l0.same(typeof await (wf1.wire.start()), 'function', 'Start');
    l0.test('Methods "aa" and "*" should be: method not found', async(l1) => {
        try {
            const wp1 = wf1.wirePassFactory({
                payload: ['payload'],
                error: false,
                method: 'aa'
            });
            await wp1.packet.state.current;
        } catch (e) {
            l1.same(e.error.name, 'WireMulti', 'multi error');
            l1.same(e.error.__errors.length, 2, '2 errors');
            l1.same(
                e.error.__errors.map(({message}) => message),
                ['method: aa not found', 'method: * not found'],
                'test both errors'
            );
            l1.end();
        }
    });
    l0.test('Method "*" should not be found', async(l1) => {
        try {
            const wp1 = wf1.wirePassFactory({
                payload: ['a'],
                error: false,
                method: 'a'
            });
            await wp1.packet.state.current;
        } catch (e) {
            l1.same(e.error.name, 'MethodNotFound', 'MethodNotFound');
            l1.same(e.error.message, 'method: * not found', 'method: * not found');
            l1.end();
        }
    });
    l0.test('Method "aa" should be: method not found', async(l1) => {
        wf1.methodRegisterFactory({name: '*'});
        try {
            const wp1 = wf1.wirePassFactory({
                payload: ['payload'],
                error: false,
                method: 'aa'
            });
            await wp1.packet.state.current;
        } catch (e) {
            l1.same(e.error.name, 'MethodNotFound', 'MethodNotFound');
            l1.same(e.error.message, 'method: aa not found', 'method: aa not found');
            l1.end();
        }
    });
    l0.test('Methods "a" and "*" should be found', async(l1) => {
        wf1.methodRegisterFactory({name: '*', fn: ({payload}) => payload.concat(['>*<'])});
        try {
            const wp1 = wf1.wirePassFactory({
                payload: ['payload'],
                error: false,
                method: 'a'
            });
            wf1.wirePassFactory({
                payload: ['payload'],
                error: false,
                method: 'a',
                match: {idx: wp1.packet.header.idx, method: 'a', tag: wf1.wire.tag}
            });
            const r = await wp1.packet.state.current;
            l1.same(wf1.wire.packets.len(), 0, 'should have 0 packets left');
            l1.same(r.payload, ['payload', '>a', '>a<', '>*<'], 'payload should match');
            l1.end();
        } catch (e) {
            l1.same(1, 2, 'error should not be thrown');
        }
    });
    l0.test('Methods "a" times out', async(l1) => {
        wf1.methodRegisterFactory({name: '*', fn: ({payload}) => payload.concat(['>*<'])});
        try {
            const wp1 = wf1.wirePassFactory({
                payload: ['payload'],
                error: false,
                method: 'a',
                config: {packet: {waitTime: 100}}
            });
            await wp1.packet.state.current;
            l1.same('1', 2, 'should throw timeout');
        } catch (e) {
            l1.same(e.error.name, 'PacketWaitTimeExpired', 'should throw timeout: name');
            l1.same(e.error.message, 'WaitTimeExpired', 'should throw timeout: message');
            l1.end();
        }
    });
    l0.test('Destroy', async(l1) => {
        wf1.wire.destroy();
        l1.end();
    });
    l0.end();
});
