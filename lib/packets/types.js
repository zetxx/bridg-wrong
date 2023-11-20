/**
 * @namespace Packet
 */

/**
 * @typedef {number} waitTime - time that req will wait before times out
 */

/**
 * @typedef {Symbol} tag - tags packet, tag tells to which process/microservice (logically) packet belongs
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
 * @typedef {object} Packet - Packet
 * @property {header} header
 * @property {match} match
 * @property {object} config
 * @property {waitTime} config.waitTime
 * @property {object} state
 * @property {function} state.resolve
 * @property {function} state.reject
 * @property {Promise} state.current
 */

/**
 * 
 * @typedef {object} Packets - Packets
 * @property {function} add - adds new packet
 * @property {function} find - finds packet
 * @property {function} len - inventory length
 * @property {function} acquire - search for packet in inventory, if not found, create new packet and adds it to inventory
 * @property {function} destroy - remove & destroy packet from inventory
 */

exports.unused = {};
