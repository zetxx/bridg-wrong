/**
 * @namespace Packet
 */
/**
 * @typedef {object} config
 * @property {number} waitTime
 */
/**
 * @typedef {object} match
 * @property {number} idx
 * @property {string[]} method
 * @property {symbol} tag
 */
/**
 * 
 * @typedef {object} header
 * @property {string[]} method
 * @property {match} match
 * @property {number} idx
 * @property {string} trace
 */

/**
 * 
 * @typedef {object} packet - The packet object
 * @property {header} header
 * @property {match} match
 * @property {object} config
 * @property {number} config.waitTime
 * @property {object} state
 * @property {function} state.resolve
 * @property {function} state.reject
 * @property {Promise} state.current
 */
/**
 * 
 * @typedef {object} Inventory - Inventory
 * @property {function} add - adds new packet
 * @property {function} find - finds packet
 * @property {function} len - inventory length
 * @property {function} acquire - search for packet in inventory, if not found, create new packet and adds it to inventory
 * @property {function} destroy - remove & destroy packet from inventory
 */

exports.unused = {};
