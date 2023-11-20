/**
 * Packet
 * @param {Object} params
 * @param {import('./types').waitTime} params.waitTime
 * @param {import('./types').tag} params.tag
 * @returns {function}
 */
export function Packet({ waitTime, tag }: {
    waitTime: import('./types').waitTime;
    tag: import('./types').tag;
}): Function;
/**
 * Packet
 * @param {Object} params
 * @param {Object} params.config
 * @param {import('./types').waitTime} params.config.waitTime
 * @param {import('./types').tag} params.config.tag
 * @returns {import('./types').Api}
 */
export function Packets({ config: { tag, waitTime } }?: {
    config: {
        waitTime: import('./types').waitTime;
        tag: import('./types').tag;
    };
}): import('./types').Api;
export declare function merge(packets: any): any;
