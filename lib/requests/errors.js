const {SError} = require('error');
class RequestNotFound extends SError {};
class RequestWaitTimeExpired extends SError {};
class RequestForceDestroy extends SError {};

module.exports = {
    NotFound: RequestNotFound,
    WaitTimeExpired: RequestWaitTimeExpired,
    ForceDestroy: RequestForceDestroy
};
