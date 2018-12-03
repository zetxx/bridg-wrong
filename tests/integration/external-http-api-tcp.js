const jsonRpcClient = require('../../tests/clients/jsonrpc-tcp');
const NodeBase = require('../../lib/base');
const NodeApiTcp = require('../../lib/api-tcp');

function HttpClient() {
    HttpClient.prototype.parent.call(this);
};

HttpClient.prototype.start = function(){
    return HttpClient.prototype.parent.prototype.start.call(this);
};

HttpClient.prototype.externalOut = function ({message, meta}) {
    var {request: {rqId}} = meta;
    return require('../../tests/clients/jsonrpc-http')({path: '/v2/5bfd80f531000061002cf9ba', protocol: 'http:', port: 80, hostname: 'www.mocky.io', method: 'bin', params: message})
        .then((message) => this.externalIn({message: Object.assign(JSON.parse(message), {rqId}), meta: {apiRequestId: meta.apiRequestId}}))
        .catch((e) => this.externalIn({message: Object.assign({}, e, {rqId}), meta: {apiRequestId: meta.apiRequestId}}));
};

var client = new (NodeBase({current: HttpClient, parent: NodeApiTcp}))();
client.registerApiMethod({
    method: 'abc.out',
    fn: function (message){
        return Object.assign({tag: 'out'}, message);
    }
});
client.registerApiMethod({
    method: 'zzz.out',
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
    var c = jsonRpcClient({port: listenPort});
        c.then((conn) => {
            conn('abc', {arg: 1})
                .then((r) => console.info(r))
                .catch((r) => console.error(r));
            conn('zzz', {blabla: 'aaaa'})
                .catch((r) => r)
                .then((r) => console.info(r))
        });
});
