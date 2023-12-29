type apiAddParams = {
    name: string;
    fn: import('../types.js').messageFn;
};
type apiFindReturns = any;
type apiAdd = (params: apiAddParams) => void;
type apiRemove = (name: string) => void;
type apiFind = (name: string) => any;
type apiSend = (message: import('../types.js').message, ready: import('../types.js').messageFn) => void;
type apiTest = (name: string) => void;
type Api = {
    add: apiAdd;
    remove: apiRemove;
    find: apiFind;
    send: apiSend;
    test: apiTest;
};
