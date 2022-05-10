const {WError, MultiError} = require('error');

class Vector extends WError {}
class VectorMulti extends MultiError {}

module.exports = {
    VectorError: Vector,
    VectorMultiError: VectorMulti
};