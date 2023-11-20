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
export type Api = {
    add: Function;
    find: Function;
    call: Function;
};
export type methods = Map<string, Function>;
