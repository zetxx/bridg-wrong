const {basename} = require('path');

module.exports = async({A, B}) => {
    /* method not found */
    try {
        let inR = await A.pass({
            packet: {
                payload: 3,
                meta: {method: 'a.b'}
            },
            direction: 'in'
        });
        await inR.promise;
    } catch (e) {
        console.error(e);
    }

    try {
        let prev = await A.pass({
            packet: {
                payload: 3,
                meta: {method: 'b'}
            },
            direction: 'in'
        });

        setTimeout(async() => {
            try {
                let sec = await B.pass({
                    packet: {
                        payload: 3,
                        meta: {
                            method: 'b',
                            idx: prev.idx
                        }
                    },
                    direction: 'in'
                });
                await sec.promise;
            } catch (e) {
                console.error(e);
            }
        }, 1);
        await prev.promise;
    } catch (e) {
        console.error(e);
    }
    return console.info(basename(__filename));
    
};