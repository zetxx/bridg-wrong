const {basename} = require('path');

module.exports = async({A}) => {
    let inR = await A.pass({
        packet: {
            payload: 3,
            meta: {method: 'a.b'}
        },
        direction: 'in'
    });
    setTimeout(A.requests.fulfill(inR), 100);
    await inR.promise;
    return console.info(basename(__filename));
};