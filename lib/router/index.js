const Methods = require('../methods');
const Requests = require('../requests');
const {RouterErrorRouteNotFound, RouterMultiError} = require('./errors');

const defaultLog = (level, message) => {};

// two vector implementation
const Router = ({
    log = defaultLog,
    vectors: [V0, V1]
} = {}) => {
    const vectors = new Map();
    vectors.set(0, V0);
    vectors.set(1, V1);

    const pass = async({vector, packet}) => {
        if(!vectors.get(vector)) {
            throw RouterErrorRouteNotFound(
                {vector}
            );
        }
    };

    return {
        log,
        pass
    };
};

module.exports = Router;
