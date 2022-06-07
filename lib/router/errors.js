const {SError, MultiError} = require('error');

class Router extends SError {}
class RouterRouteNotFound extends SError {}
class RouterMulti extends MultiError {}

module.exports = {
    RouterError: Router,
    RouterErrorRouteNotFound:
        (args) =>
            RouterRouteNotFound.create(
                'Route {vector} not found',
                args
            ),
    RouterMultiError: RouterMulti
};