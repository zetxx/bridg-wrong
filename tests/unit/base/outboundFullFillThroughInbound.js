const {basename} = require('path');

module.exports = async({A}) => {
    try {
        let outR = await A.pass({
            packet: {
                payload: 3,
                meta: {method: 'a.b'}
            },
            direction: 'out'
        });
        setTimeout(async() => {
            try {
                let inR = await A.pass({
                    packet: {
                        payload: 3,
                        meta: {idx: outR.idx, nodeId: outR.nodeId}
                    },
                    direction: 'in'
                });
                await inR.promise;
            } catch (e) {
                console.error(e);
            }
        }, 100);
        await outR.promise;
    } catch (e) {
        console.error(e);
    }
    return console.info(basename(__filename));
};