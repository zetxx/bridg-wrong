require('./echo');
const init1 = require('./init/1');
const init2 = require('./init/2');
const inboundDirectFullFill = require('./inboundDirectFullFill');
const outboundDirectFullFill = require('./outboundDirectFullFill');
const inboundFullFillThroughOutbound = require('./inboundFullFillThroughOutbound');
const outboundFullFillThroughInbound = require('./outboundFullFillThroughInbound');
const a1 = require('./1');

(async() => {
    const {A: A1} = (await init1())();
    const {A: A2, B: B2} = (await init2())();

    await inboundDirectFullFill({A: A1});
    await outboundDirectFullFill({A: A1});
    await inboundFullFillThroughOutbound({A: A1});
    await outboundFullFillThroughInbound({A: A1});
    await a1({A: A2, B: B2});

    console.log('finished');
})();

