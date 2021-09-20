const {WError, MultiError} = require('error');

class Bridge extends WError {}
class BridgeMulti extends MultiError {}

module.exports = {
    BridgeError: Bridge,
    BridgeMultiError: BridgeMulti
};