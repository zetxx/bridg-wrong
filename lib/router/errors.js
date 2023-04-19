const {SError, MultiError} = require('error');

class Router extends SError {}
class RouterWireNotFound extends SError {}
class RouterMulti extends MultiError {}

module.exports = {
    RouterError: Router,
    RouterErrorWireNotFound:
        (args) =>
            RouterWireNotFound.create(
                'Wire {wire} not found',
                args
            ),
    RouterMultiError: RouterMulti
};
