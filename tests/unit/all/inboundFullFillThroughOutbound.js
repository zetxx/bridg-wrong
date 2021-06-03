const {basename} = require('path');

module.exports = async({A}) => {
    try {
        let inR = await A.pass({
            packet: {
                payload: 3,
                meta: {method: 'a.b'}
            },
            direction: 'in'
        });
        setTimeout(async() => {
            let outR = await A.pass({
                packet: {
                    payload: 3,
                    meta: {idx: inR.idx, nodeId: inR.nodeId}
                },
                direction: 'out'
            });
            try {
                await outR.promise;
            } catch (e) {
                console.error(e);
            }
        }, 100);
        await inR.promise;
    } catch (e) {
        console.error(e);
    }
    return console.info(basename(__filename));
};