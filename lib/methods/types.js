/**
 * @callback add
 * @property {object} p
 * @property {string} p.name
 * @property {object} p.options - function options, can be used on later stage
 * @property {boolean} p.options.response - is function response of some call
 * @property {import('../types.js').messageFn} p.fn
 * @returns {void}
 */
/**
 * @callback remove
 * @property {object} p
 * @property {string} p.name
 * @returns {void}
 */
/**
 * @callback find
 * @property {object} p
 * @property {string} p.name
 * @returns {import('../types.js').messageFn}
 */
/**
 * @callback ask
 * @param {import('../types.js').message} message
 * @returns {Promise}
 */
/**
 * @callback notify
 * @param {import('../types.js').message} message
 * @returns {Promise}
 */
/**
 * @callback send
 * @param {import('../types.js').message} message
 * @returns {void}
 */
/**
 * @callback test
 * @param {import('../types.js').message} data - message
 * @param {any} ctx - extra context
 * @returns {any}
 */
/**
 * @callback log
 * @param {string} level - log level
 * @param {any} logData - data that will be logged
 * @returns {void}
 */
/**
 * @callback responseMethodName
 * @param {object} p
 * @param {string|number} id - some unique id
 * @returns {string}
 */

/**
 * @typedef {Object} Api
 * @property {add} Api.add
 * @property {remove} Api.remove
 * @property {find} Api.find
 * @property {send} Api.send
 * @property {test} Api.test
 */

exports.unused = {};
