/**
 * Packet init
 * @param {Object} init
 * @param {number} init.waitTime - how much time to wait before times out
 * @param {Symbol} init.tag
 * @returns {function}
 */
export function Packet({ waitTime, tag }: {
    waitTime: number;
    tag: Symbol;
}): Function;
/**
 * Packets init
 * @param {Object} init
 * @param {number} init.waitTime - how much time to wait before times out
 * @param {Symbol} init.tag
 * @returns {import('./types').Inventory}
 */
export function Packets({ config: { tag, waitTime } }?: {
    waitTime: number;
    tag: Symbol;
}): import('./types').Inventory;
export declare function merge(packets: any): any;
