/**
 * @constant {Object} errors
 * @property {Error} errors.TimeOut
 * @property {Error} errors.NotFound
*/
const errors = {
    TimeOut: new Error('TimeOut'),
    NotFound: new Error('NotFound')
};

module.exports = errors;
