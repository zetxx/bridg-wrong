const jsonRpcClient = require('../../tests/clients/jsonrpc-http');
const NodeBase = require('../../lib/base');
const NodeApiHttp = require('../../lib/api-http');

function HttpClient() {
    HttpClient.prototype.parent.call(this);
};

HttpClient.prototype.start = function(){
    return HttpClient.prototype.parent.prototype.start.call(this);
};

HttpClient.prototype.externalOut = function ({message, meta}) {
    return jsonRpcClient({path: '/v2/5bfd80f531000061002cf9ba', protocol: 'http:', port: 80, hostname: 'www.mocky.io', method: 'bin', params: message})
        .then((message) => this.externalIn({message: JSON.parse(message), meta: {apiRequestId: meta.apiRequestId}}))
        .catch((e) => this.externalIn({message: e, meta: {apiRequestId: meta.apiRequestId}}));
};

var client = new (NodeBase({current: HttpClient, parent: NodeApiHttp}))();
client.registerApiMethod({
    method: 'abc.out',
    fn: function (message){
        return Object.assign({tag: 'out'}, message);
    }
});
client.registerApiMethod({
    method: 'abc.in',
    fn: function (message){
        return Object.assign({api: 'in'}, message);
    }
});
client.start().then(({listenPort}) => {
    console.log({listenPort});
    jsonRpcClient({port: listenPort, method: 'abc', params: {a: 1}})
        .then(console.log);
});
