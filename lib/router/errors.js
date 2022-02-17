const {WError, MultiError} = require('error');

class Router extends WError {}
class RouterMulti extends MultiError {}

module.exports = {
    RouterError: Router,
    RouterMultiError: RouterMulti
};