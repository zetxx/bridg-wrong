const util = require('util');
const net = require('net');
const jsonRpcClient = require('../../tests/jsonrpc-client');
const node = require('../../lib/api-http');

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
            this.connections.push({id: this.connectionCounter++, client});
            client.on('data', (data) => this.externalIn({message: JSON.stringify(data.toString())}));
        });
        this.server.on('listening', resolve);
        this.server.listen(34443);
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
        console.log('started and listening');
    });
