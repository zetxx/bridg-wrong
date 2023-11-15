export const unused: {};
export type config = {
    waitTime: number;
};
export type match = {
    idx: number;
    method: string[];
    tag: symbol;
};
export type header = {
    method: string[];
    match: match;
    idx: number;
    trace: string;
};
/**
 * - The packet object
 */
export type packet = {
    header: header;
    match: match;
    config: {
        waitTime: number;
    };
    state: {
        resolve: Function;
        reject: Function;
        current: Promise<any>;
    };
};
/**
 * - Inventory
 */
export type Inventory = {
    /**
     * - adds new packet
     */
    add: Function;
    /**
     * - finds packet
     */
    find: Function;
    /**
     * - inventory length
     */
    len: Function;
    /**
     * - search for packet in inventory, if not found, create new packet and adds it to inventory
     */
    acquire: Function;
    /**
     * - remove & destroy packet from inventory
     */
    destroy: Function;
};
