export const unused: {};
export type message = {
    id: number;
    method: string;
    params: params;
    result: result;
    error: error;
    meta: meta;
};
export type messageFn = (params: message) => any;
