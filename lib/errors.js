const CustomError = require('./error');

const Method = CustomError({code: 'Method'});
const NotFound = CustomError({code: 'NotFound', parent: Method});
const TimedOut = CustomError({code: 'TimedOut', parent: Method});
const NotImplemented = CustomError({code: 'NotImplemented', parent: Method});

module.exports = {
    NotFound,
    TimedOut,
    NotImplemented
};
