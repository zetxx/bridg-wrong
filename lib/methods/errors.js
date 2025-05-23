/**
 * @constant {Object} errors
 * @property {Error} errors.TimeOut
 * @property {Error} errors.NotFound
*/
const errors = {
    TimeOut: new Error('TimeOut'),
    NotFound: (opts) => new Error('NotFound', opts)
};

module.exports = errors;
