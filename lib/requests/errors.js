const {SError} = require('error');
class WaiterNotFound extends SError {};
class WaiterWaitTimeExpired extends SError {};
class WaiterForceDestroy extends SError {};

module.exports = {
    NotFound: WaiterNotFound,
    WaitTimeExpired: WaiterWaitTimeExpired,
    ForceDestroy: WaiterForceDestroy
};
