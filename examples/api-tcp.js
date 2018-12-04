const net = require('net');
const Node = require('../lib/base.js');

const listenPort = 2300;
const getId = () => {
    var id = 1;
    return () => id++;
};

function ApiHttp() {
    ApiHttp.prototype.parent.call(this);
    this.clients = [];
    this.nextClientId = getId();
};

ApiHttp.prototype.start = function(){
    return this.parent.prototype.parent.prototype.start.call(this)
        .then(() => (new Promise((resolve, reject) => {
            var s = net.createServer((c) => {
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
            s.listen(listenPort, resolve);
        })))
        .then(() => console.log('api-tcp ready'))
        .then(() => ({listenPort}));
};

ApiHttp.prototype.respondToClient = function(isError, data, id, connectionId) {
    var d = JSON.stringify({id, [(isError && 'error') || 'result']: data});
    var str = Buffer.from(d, 'utf8').toString('base64');
    var conn = this.clients.find((conn) => conn.clientId === connectionId);
    if (conn.wire) {
        conn.wire.write(`H:${str.length}:${str}`);
    }
};

ApiHttp.prototype.requestReceived = function({method, params, id}, connectionId) {
    this.apiRequestReceived({message: params, meta: {method, connectionId}})
        .then((response) => this.respondToClient(false, response, id, connectionId))
        .catch((errorResponse) => this.respondToClient(true, errorResponse, id, connectionId));
};

module.exports = Node({current: ApiHttp});