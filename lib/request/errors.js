const CustomError = require('../error');

const Request = CustomError({code: 'Request'});
const NotFound = CustomError({code: 'NotFound', parent: Request});
const WaitTimeExpired = CustomError({code: 'WaitTimeExpired', parent: Request});
const ForceDestroy = CustomError({code: 'ForceDestroy', parent: Request});

module.exports = {
    NotFound,
    WaitTimeExpired,
    ForceDestroy
};
