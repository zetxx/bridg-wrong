const Methods = require('../methods');
const Requests = require('../requests');
const {RouterError, RouterMultiError} = require('./errors');

const defaultLog = (level, message) => {};

// two vector implementation
const Router = ({
    log = defaultLog,
    vectors: [V1, V2]
} = {}) => {
    return {
        log
    };
};

module.exports = Router;
