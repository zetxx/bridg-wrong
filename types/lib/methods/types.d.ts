export const unused: {};
export type add = {
    method: string[];
    fn: Function;
};
export type find = {
    method: string[];
};
export type call = {
    method: string[];
    ctx: object;
};
export type Method = {
    add: Function;
    find: Function;
    call: Function;
};
export type method = {
    method: string;
    fn: Function;
};
