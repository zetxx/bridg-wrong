const util = require('util');
const http = require('http');
const node = require('./base.js');

function ApiHttp() {
    node.call(this);
};
util.inherits(ApiHttp, node);

ApiHttp.prototype.start = function(){
    return node.prototype.start.call(this)
        .then(() => (new Promise((resolve, reject) => {
            var s = http.createServer(this.httpRequestReceived.bind(this)).on('listening', resolve);
            s.listen(2300);
        })))
        .then(() => console.log('api-http ready'));
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

module.exports = ApiHttp;