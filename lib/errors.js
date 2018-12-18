function CustomError({code, args} = {}) {
    this.stack = (new Error()).stack.split('\n');
    this.stack = this.stack.slice(0, 1).concat(this.stack.slice(4)).join('\n');
    this.code = code;
    this.args = args;
};
module.exports = {
    methodNotFound: (args) => (new CustomError({code: 'MethodNotFound', args})),
    methodTimedOut: (args) => (new CustomError({code: 'methodTimedOut', args})),
    notImplemented: () => (new CustomError({code: 'notImplemented'}))
};
