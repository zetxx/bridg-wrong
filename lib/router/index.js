const Methods = require('../methods');
const Requests = require('../requests');
const {RouterErrorVectorNotFound, RouterMultiError} = require('./errors');

const defaultLog = (level, message) => {};

// two vector implementation
const Router = ({
    log = defaultLog,
    vectors: [V0, V1]
} = {}) => {
    const vectors = new Map();
    vectors.set(V0.tag, V0);
    vectors.set(V1.tag, V1);

    const pass = async({vector, packet}) => {
        if(!vectors.get(vector)) {
            throw RouterErrorVectorNotFound(
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
