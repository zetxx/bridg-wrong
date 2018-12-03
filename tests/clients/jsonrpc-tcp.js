const net = require('net');

module.exports = ({host = 'localhost', port = 80}) => {
    var id = 1;
    return new Promise((resolve, reject) => {
        var requests = [];
        const wire = net.createConnection({host, port}, () => resolve((method, params) => (new Promise((resolve, reject) => {
            const respId = id + 0;
            var body = Buffer.from(JSON.stringify({
                jsonrpc: "2.0",
                method,
                params,
                id: id++
            }), 'utf8').toString('base64');
            requests.push({id: respId, resolve, reject});
            wire.write(`H:${body.length}:${body}`);
        }))));
        wire.on('data', (data) => {
            var [len, dataRaw] = data.toString('utf8').slice(2).split(':');
            // len = parseInt(len);
            var {id, result, error} = JSON.parse(Buffer.from(dataRaw, 'base64').toString('utf8'))
            var resolveMatch = requests.findIndex((req) => req.id === id);
            resolveData = requests[resolveMatch];
            requests = requests.slice(0, resolveMatch).concat(requests.slice(resolveMatch + 1));
            if (result) {
                resolveData.resolve(result);
            } else if (error) {
                resolveData.reject(error);
            }
        });
    });
};