const jsonRpcClient = require('../../tests/clients/jsonrpc-http');
const NodeApiHttp = require('../../examples/api-http');

class HttpClient extends NodeApiHttp {
    start() {
        return super.start();
    }
    externalOut({message, meta}) {
        return jsonRpcClient({path: '/v2/5bfd80f531000061002cf9ba', protocol: 'http:', port: 80, hostname: 'www.mocky.io', method: 'bin', params: message})
            .then((message) => this.externalIn({message: JSON.parse(message), meta: {apiRequestId: meta.apiRequestId}}))
            .catch((e) => this.externalIn({message: e, meta: {apiRequestId: meta.apiRequestId}}));
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
    method: 'abc.in',
    fn: function(message) {
        return Object.assign({api: 'in'}, message);
    }
});
client.start()
    .then(({listenPort}) => {
        console.log({listenPort});
        return jsonRpcClient({port: listenPort, method: 'abc', params: {a: 1}})
            .then(console.log)
            .then(() => client.stop());
    })
    .catch(console.error);
