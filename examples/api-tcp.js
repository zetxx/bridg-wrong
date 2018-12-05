const net = require('net');
const Node = require('../index.js');

const listenPort = 2300;
const getId = () => {
    var id = 1;
    return () => id++;
};

class ApiTcp extends Node {
    constructor() {
        super();
        this.clients = [];
        this.nextClientId = getId();
        this.server = null;
    }
    start() {
        return super.start.call(this)
            .then(() => (new Promise((resolve, reject) => {
                this.server = net.createServer((c) => {
                    const clientId = this.nextClientId();
                    this.clients.push({clientId, wire: c});
                    var bufferData = '';
                    c.on('data', (data) => {
                        bufferData = bufferData + data.toString('utf8');
                        while (bufferData.startsWith('H:')) {
                            var [len, dataRaw] = bufferData.slice(2).split(':');
                            len = parseInt(len);
                            if (len <= dataRaw.length) {
                                bufferData = bufferData.slice(len + 3 + len.toString().length);
                                this.requestReceived(JSON.parse(Buffer.from(dataRaw, 'base64').toString('utf8')), clientId);
                            }
                        }
                    });
                });
                this.server.listen(listenPort, resolve);
            })))
            .then(() => console.log('api-tcp ready'))
            .then(() => ({listenPort}));
    }
    stop() {
        return super.stop()
            .then(() => {
                this.server.close(() => this.server.unref());
                return this.clients.map(({wire}) => wire.end());
            });
    }
    respondToClient(isError, data, id, connectionId) {
        var d = JSON.stringify({id, [(isError && 'error') || 'result']: data});
        var str = Buffer.from(d, 'utf8').toString('base64');
        var conn = this.clients.find((conn) => conn.clientId === connectionId);
        if (conn.wire) {
            conn.wire.write(`H:${str.length}:${str}`);
        }
    }
    requestReceived({method, params, id}, connectionId) {
        this.apiRequestReceived({message: params, meta: {method, connectionId}})
            .then((response) => this.respondToClient(false, response, id, connectionId))
            .catch((errorResponse) => this.respondToClient(true, errorResponse, id, connectionId));
    }
};

module.exports = ApiTcp;
