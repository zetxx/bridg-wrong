const util = require('util');
const net = require('net');
const jsonRpcClient = require('../../tests/jsonrpc-client');
const node = require('../../lib/api-http');

const codec = {
    encode: (message) => Buffer.from(JSON.stringify(message), 'utf8'),
    decode: (message) => JSON.parse(message.toString())
};

function TcpServer() {
    node.call(this);
};
util.inherits(TcpServer, node);

TcpServer.prototype.start = function() {
    this.connections = [];
    this.connectionCounter = 1;
    this.messageMatchKeys = ['alabal', 'tarkaleta'];

    return new Promise((resolve, reject) => {
        this.server = net.createServer((client) => {
            const ctx = {id: this.connectionCounter++, client};
            this.connections.push(ctx);
            client.on('data', (data) => {
                return this.externalIn({message: codec.decode(data), connectionId: ctx.id});
            });
        });
        this.server.on('listening', resolve);
        this.server.listen(34443);
    });
};

TcpServer.prototype.findExternalConnection = function (connectionId) {
    var connIdx = this.connections.findIndex(({id}) => connectionId === id);
    if (connIdx >= 0) {
        return Promise.resolve(this.connections[connIdx]);
    }
    return Promise.reject(new Error('connectionNotFound'));
};

TcpServer.prototype.externalIn = function({message, connectionId}) {
    var {method, ...restOfMessage} = message;
    return node.prototype.externalIn.call(this, {message: restOfMessage, meta: {connectionId, method}});
};

TcpServer.prototype.externalOut = function({message, meta: {connectionId}}) {
    return this.findExternalConnection(connectionId)
        .then(({client}) => client.write(codec.encode(message)))
        .catch((e) => {
            // connection error
            console.error('externalOut', e);
        });
};

var inst = new TcpServer();
inst.registerApiMethod({
    method: 'abc.out',
    fn: function (message){
        return Object.assign({tag: 'out'}, message);
    }
});
inst.registerApiMethod({
    method: 'abc.in',
    fn: function (message){
        return Object.assign({api: 'in'}, message);
    }
});
inst.start()
    .then(() => {
        var conn1 = net.createConnection({port: 34443});
        conn1.on('data', (data) => {
            console.log(data.toString());
        });
        conn1.write(JSON.stringify({method: 'externalmethod', arg1: 1, arg2: 2}));
        console.log('started and listening');
    });
