const http = require('http');
const Node = require('./base.js');

const listenPort = 2300;

function ApiHttp() {
    ApiHttp.prototype.parent.call(this);
};

ApiHttp.prototype.start = function(){
    return this.parent.prototype.parent.prototype.start.call(this)
        .then(() => (new Promise((resolve, reject) => {
            var s = http.createServer(this.httpRequestReceived.bind(this)).on('listening', resolve);
            s.listen(listenPort);
        })))
        .then(() => console.log('api-http ready'))
        .then(() => ({listenPort}));
};

ApiHttp.prototype.httpRequestCaptureChunks = function (req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk.toString()));
        req.on('end', () => resolve(JSON.parse(chunks.join(''))));
    });
};

ApiHttp.prototype.httpRequestReceived = function(req, res) {
    this.httpRequestCaptureChunks(req)
        .then(({id = 0, method, params} = {}) => this.apiRequestReceived({message: params, meta: {method}}))
        .then((response) => res.write(JSON.stringify(response)))
        .catch((errorResponse) => res.write(errorResponse.message));
};

module.exports = Node({current: ApiHttp});