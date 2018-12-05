const jsonRpcClient = require('../clients/jsonrpc-tcp');
const NodeApiTcp = require('../../examples/api-tcp');

class HttpClient extends NodeApiTcp {
    start() {
        return super.start();
    }

    externalOut({message, meta}) {
        var {request: {rqId}} = meta;
        return require('../../tests/clients/jsonrpc-http')({path: '/v2/5bfd80f531000061002cf9ba', protocol: 'http:', port: 80, hostname: 'www.mocky.io', method: 'bin', params: message})
            .then((message) => this.externalIn({message: Object.assign(JSON.parse(message), {rqId}), meta: {apiRequestId: meta.apiRequestId}}))
            .catch((e) => this.externalIn({message: Object.assign({}, e, {rqId}), meta: {apiRequestId: meta.apiRequestId}}));
    }
};

var client = new HttpClient();
client.registerApiMethod({
    method: 'abc.out',
    fn: function(message) {
        return Object.assign({tag: 'out'}, message);
    }
});
client.registerApiMethod({
    method: 'zzz.out',
    fn: function(message) {
        return Object.assign({tag: 'out'}, message);
    }
});
client.registerApiMethod({
    method: 'abc.in',
    fn: function(message) {
        return Object.assign({api: 'in'}, message);
    }
});
client.start()
    .then(({listenPort}) => {
        return jsonRpcClient({port: listenPort})
            .then((conn) => Promise.all([
                conn('abc', {arg: 1})
                    .then((r) => console.info(r))
                    .catch((r) => console.error(r)),
                conn('zzz', {blabla: 'aaaa'})
                    .catch((r) => r)
                    .then((r) => console.info(r))
            ]))
            .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e))
    .then(() => client.stop())
    .catch((e) => console.error(e));
