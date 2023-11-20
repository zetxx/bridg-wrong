export const unused: {};
/**
 * - time that req will wait before times out
 */
export type waitTime = number;
/**
 * - tags packet, tag tells to which process/microservice (logically) packet belongs
 */
export type tag = Symbol;
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
 * - Packet
 */
export type Packet = {
    header: header;
    match: match;
    config: {
        waitTime: waitTime;
    };
    state: {
        resolve: Function;
        reject: Function;
        current: Promise<any>;
    };
};
/**
 * - Packets
 */
export type Packets = {
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
/**
 * - Api
 */
export type Api = {
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
