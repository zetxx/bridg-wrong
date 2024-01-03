export const unused: {};
export type add = () => any;
export type remove = () => any;
export type find = () => any;
export type ask = (message: import('../types.js').message) => Promise<any>;
export type notify = (message: import('../types.js').message) => Promise<any>;
export type send = (message: import('../types.js').message) => void;
export type test = (data: import('../types.js').message, ctx: any) => any;
export type log = (level: string, logData: any) => void;
export type responseMethodName = (p: object, id: string | number) => string;
export type Api = {
    add: add;
    remove: remove;
    find: find;
    send: send;
    test: test;
};
