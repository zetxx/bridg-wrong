const {SError} = require('error');
class BridgeMethodNotFound extends SError {};

module.exports = {
    NotFound: BridgeMethodNotFound
};
