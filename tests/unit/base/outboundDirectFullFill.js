const {basename} = require('path');

module.exports = async({A}) => {
    let outR = await A.pass({
        packet: {
            payload: 3,
            meta: {method: 'a.b'}
        },
        direction: 'out'
    });
    setTimeout(A.requests.fulfill(outR), 100);
    await outR.promise;
    return console.info(basename(__filename));
};