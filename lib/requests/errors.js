const {SError} = require('error');
class BridgeRequestNotFound extends SError {};
class BridgeRequestWaitTimeExpired extends SError {};
class BridgeRequestForceDestroy extends SError {};

module.exports = {
    NotFound: BridgeRequestNotFound,
    WaitTimeExpired: BridgeRequestWaitTimeExpired,
    ForceDestroy: BridgeRequestForceDestroy
};
