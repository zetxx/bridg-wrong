const CustomError = require('../error');

const Method = CustomError({code: 'Method'});
const NotFound = CustomError({code: 'NotFound', parent: Method});

module.exports = {
    NotFound
};
