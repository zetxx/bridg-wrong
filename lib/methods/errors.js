const {SError} = require('error');
class MethodNotFound extends SError {};

module.exports = {
    NotFound: MethodNotFound
};
