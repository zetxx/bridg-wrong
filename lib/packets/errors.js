const {SError} = require('error');
class PacketNotFound extends SError {};
class PacketWaitTimeExpired extends SError {};
class PacketForceDestroy extends SError {};

module.exports = {
    NotFound: PacketNotFound,
    WaitTimeExpired: PacketWaitTimeExpired,
    ForceDestroy: PacketForceDestroy
};
