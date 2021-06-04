const CustomError = require('../error');

const Request = CustomError({code: 'Request'});
const NotFound = CustomError({code: 'NotFound', parent: Request});

module.exports = {
    NotFound
};
