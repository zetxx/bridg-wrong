const http = require('http');
const Node = require('../index.js');

const listenPort = 2300;
class ApiHttp extends Node {
    constructor() {
        super();
        this.httpServer = null;
        this.httpApiClients = [];
    }
    start() {
        return super.start()
            .then(() => (new Promise((resolve, reject) => {
                this.httpServer = http.createServer(this.httpRequestReceived.bind(this)).on('listening', resolve);
                this.httpServer.listen(listenPort);
            })))
            .then(() => console.log('api-http ready'))
            .then(() => ({listenPort}));
    }
    stop() {
        return super.stop()
            .then(() => {
                this.httpServer.close(() => {
                    console.log('unref: ApiHttp');
                    this.httpServer.unref();
                });
                return this.httpApiClients.map((connection) => (connection.end() | connection.destroy()));
            });
    }
    httpRequestCaptureChunks(req) {
        this.httpApiClients.push(req.connection);
        return new Promise((resolve, reject) => {
            const chunks = [];
            req.on('data', (chunk) => chunks.push(chunk.toString()));
            req.on('end', () => resolve(JSON.parse(chunks.join(''))));
        });
    }
    httpRequestReceived(req, res) {
        return this.httpRequestCaptureChunks(req)
            .then(({id = 0, method, params} = {}) => this.apiRequestReceived({message: params, meta: {method}}))
            .then((response) => res.write(JSON.stringify(response)))
            .catch((errorResponse) => res.write(errorResponse.message));
    }
};

module.exports = ApiHttp;
