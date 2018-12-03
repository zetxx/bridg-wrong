const util = require('util');
const jsonRpcClient = require('../../tests/jsonrpc-client');
const node = require('../../lib/api-http');

function HttpClient() {
    node.call(this);
};
util.inherits(HttpClient, node);

HttpClient.prototype.start = function(){
    return node.prototype.start.call(this);
};

HttpClient.prototype.externalOut = function ({message, meta}) {
    return jsonRpcClient({path: '/v2/5bfd80f531000061002cf9ba', protocol: 'http:', port: 80, hostname: 'www.mocky.io', method: 'bin', params: message})
        .then((message) => this.externalIn({message: JSON.parse(message), meta: {requestId: meta.requestId}}))
        .catch((e) => this.externalIn({message: e, meta: {requestId: meta.requestId}}));
};

var client = new HttpClient();
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
client.start().then(() => {
    jsonRpcClient({method: 'abc', params: {a: 1}})
        .then(console.log);
});
