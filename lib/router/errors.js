const {SError, MultiError} = require('error');

class Router extends SError {}
class RouterVectorNotFound extends SError {}
class RouterMulti extends MultiError {}

module.exports = {
    RouterError: Router,
    RouterErrorVectorNotFound:
        (args) =>
            RouterVectorNotFound.create(
                'Vector {vector} not found',
                args
            ),
    RouterMultiError: RouterMulti
};