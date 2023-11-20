/**
 * Description
 * @param {Object} params
 * @param {import('./types').waitTime} params.waitTime
 * @param {import('./types').tag} params.tag
 * @returns {import('./types').Packet}
 */
export function Packet({ waitTime, tag }: {
    waitTime: import('./types').waitTime;
    tag: import('./types').tag;
}): import('./types').Packet;
export function Packets({ config: { tag, waitTime } }?: {
    config?: {
        tag: any;
        waitTime?: number;
    };
}): {
    add({ config, header: { method, trace, match } }: {
        config: any;
        header?: {
            method: any;
            trace: any;
            match: any;
        };
    }): any;
    find({ idx, tag: curtag }?: {
        idx: any;
        tag?: any;
    }): any;
    fulfill(packet: any): (payload?: {}) => void;
    len(): number;
    acquire({ payload, header, match, config }: {
        payload: any;
        header: any;
        match: any;
        config: any;
    }): any;
    destroy(): void[];
};
export declare function merge(packets: any): any;
