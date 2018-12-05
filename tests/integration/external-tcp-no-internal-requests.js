const net = require('net');
const Node = require('../../examples/api-http');

const codec = {
    encode: (message) => Buffer.from(JSON.stringify(message), 'utf8'),
    decode: (message) => JSON.parse(message.toString())
};

class TcpExternal extends Node {
    constructor() {
        super();
        this.tcpExternalClients = [];
        this.connectionCounter = 1;
        this.messageMatchKeys = ['alabal', 'tarkaleta'];
    }
    start() {
        return super.start()
            .then(() => new Promise((resolve, reject) => {
                this.tcpServer = net.createServer((client) => {
                    const ctx = {id: this.connectionCounter++, client};
                    this.tcpExternalClients.push(ctx);
                    client.on('data', (data) => {
                        return this.externalIn({message: codec.decode(data), connectionId: ctx.id});
                    });
                });
                this.tcpServer.on('listening', resolve);
                this.tcpServer.listen(34443);
            }));
    }

    findExternalConnection(connectionId) {
        var connIdx = this.tcpExternalClients.findIndex(({id}) => connectionId === id);
        if (connIdx >= 0) {
            return Promise.resolve(this.tcpExternalClients[connIdx]);
        }
        return Promise.reject(new Error('connectionNotFound'));
    }

    externalIn({message, connectionId}) {
        var {method, ...restOfMessage} = message;
        return super.externalIn({message: restOfMessage, meta: {connectionId, method}});
    }

    externalOut({message, meta: {connectionId}}) {
        return this.findExternalConnection(connectionId)
            .then(({client}) => client.write(codec.encode(message)))
            .catch((e) => {
                // connection error
                console.error('externalOut', e);
            });
    }

    stop() {
        return super.stop()
            .then(() => {
                this.tcpServer.close(() => {
                    console.log('unref: TcpExternal');
                    this.tcpServer.unref();
                });
                return this.tcpExternalClients.map(({client}) => client.end());
            });
    }
}

var inst = new TcpExternal();
inst.registerApiMethod({
    method: 'abc.out',
    fn: function(message) {
        return Object.assign({tag: 'out'}, message);
    }
});
inst.registerApiMethod({
    method: 'abc.in',
    fn: function(message) {
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
        setTimeout(() => inst.stop(), 3000);
        return Promise.resolve();
    })
    .catch(console.error);
