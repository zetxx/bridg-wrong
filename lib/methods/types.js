/**
 * @typedef {object} apiAddParams
 * @property {string} apiAddParams.name
 * @property {import('../types.js').messageFn} apiAddParams.fn
 */
/**
 * @typedef {import('./types').apiAdd} apiFindReturns
 * @property {string} apiFindParams.name
 */
/**
 * @callback apiAdd
 * @param {apiAddParams} params
 * @returns {void}
 */
/**
 * @callback apiRemove
 * @param {string} name
 * @returns {void}
 */
/**
 * @callback apiFind
 * @param {string} name
 * @returns {apiFindReturns}
 */
/**
 * @callback apiSend
 * @param {import('../types.js').message} message
 * @param {import('../types.js').messageFn} ready
 * @returns {void}
 */
/**
 * @callback apiTest
 * @param {string} name
 * @returns {void}
 */

/**
 * @typedef {Object} Api
 * @property {apiAdd} Api.add
 * @property {apiRemove} Api.remove
 * @property {apiFind} Api.find
 * @property {apiSend} Api.send
 * @property {apiTest} Api.test
 */
