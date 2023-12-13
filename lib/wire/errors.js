const {WError, MultiError} = require('error');

class Wire extends WError {}
class WireMulti extends MultiError {}

module.exports = {
    WireError: Wire,
    WireMultiError: WireMulti
};
