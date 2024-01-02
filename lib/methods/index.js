const errors = require('./errors.js');
/**
 * @typedef {Object} AddValue
 * @property {import('../types.js').messageFn} fn
 */

const counter = () => {
    /**
     * @constant {number}
     */
    let cc = 0;
    /**
     * @returns {number}
     */
    return () => {
        if ((Number.MAX_SAFE_INTEGER - 1) === cc) {
            cc = 0;
        }
        return ++cc;
    };
};

const uidCounter = counter();
const callerCounter = counter();
const requestCounter = counter();

/**
 * Methods bootstrap
 * @property {object} props
 * @property {import('../wires/types.js').Api} props.wires
 * @property {Map<string, AddValue>} props.externalList
 * @property {any} props.config
 * @returns {import('./types.js').Api}
 */
const Methods = ({
    wires,
    list: externalList,
    config = {}
}) => {
    /** @constant {Map<string, AddValue>} */
    const list = (externalList || new Map());

    return class methods {
        constructor () {
            wires.register((...args) => this.test(...args));
            this.namespace = config?.namespace || '';
            this.uid = uidCounter();
        }
        /**
         * Log
         * @type {import('./types.js').log}
         */
        log(level, ...rest) {
            console[level] && console[level](...[this.namespace, ...rest]);
        }
        /**
         * Log
         * @type {import('./types.js').responseMethodName}
         */
        responseMethodName({id, method} = {}) {
            return [
                this.namespace,
                method,
                'response',
                this.uid,
                callerCounter(),
                id
            ]
                .filter(Boolean)
                .join('.');
        }
        /**
         * Add method to method list
         * @type {import('./types.js').add}
         */
        add({name: key, fn}) {
            this.log('debug', 'Add', key);
            list.set(key, {fn});
        }
        /**
         * remove
         * @type {import('./types.js').remove}
         */
        remove({name: key}) {
            this.log('debug', 'Remove', key);
            list.delete(key);
        }
        /**
         * find
         * @type {import('./types.js').find}
         */
        find({name: key}) {
            this.log('debug', 'Find', key);
            return list.get(key);
        }
        /**
         * ask
         * @type {import('./types.js').ask}
         */
        async ask(message) {
            return await this.send({
                ...message,
                id: requestCounter()
            });
        }
        /**
         * notify
         * @type {import('./types.js').notify}
         */
        async notify(message) {
            return this.send({
                ...message,
                id: undefined
            });
        }
        /**
         * send
         * @type {import('./types.js').send}
         * @returns {any}
         */
        async send(message) {
            return await new Promise((resolve, reject) => {
                if (message.id) { // id exists = request, else, notification
                    if (!message.meta) {
                        message.meta = {};
                    }
                    this.log('debug', 'Send Request', message);
                    const listenMethod = this.responseMethodName(message);
                    message.meta.caller = listenMethod;
                    const to = setTimeout(
                        () => {
                            this.remove({name: listenMethod});
                            reject({error: errors.TimeOut});
                        },
                        (message?.meta?.timeout || config?.timeout || 3000)
                    );
                    const methodNotFound = () => {
                        clearTimeout(to);
                        this.remove({name: listenMethod});
                        reject({error: errors.NotFound});
                    };
                    // add response method
                    this.add({
                        name: listenMethod,
                        fn: (data = {}) => {
                            clearTimeout(to);
                            this.remove({name: listenMethod});
                            if (data.error) {
                                return reject(data);
                            }
                            resolve(data);
                        }
                    });
                    wires.write(message, methodNotFound);
                } else {
                    this.log('debug', 'Send Notification', message);
                    const wr = wires.write(message);
                    resolve(wr);
                }
            });
        }
        /**
         * test
         * @type {import('./types.js').test}
         * @param {import('../types.js').message} data
         * @param {object} ctx
         * @returns {any}
         */
        async test(data, ctx) {
            const m = this.find({name: data.method});
            if (m) {
                this.log('debug', 'Found', data.method, data);
                let mr = data;
                try {
                    if (mr.method === mr.meta?.caller) { // this is response, it calls auto generated fn that resolves promise only
                        return m.fn(data);
                    }
                    const r = await Promise.resolve(
                        m.fn(
                            {...data}, {
                                ...ctx,
                                send: async(message) => {
                                    return await this.send({
                                        ...message,
                                        meta: {
                                            ...message.meta,
                                            passTrough: data.meta.passTrough,
                                            timeout: message?.meta?.timeout
                                        }
                                    });
                                },
                                ask: async(message) => {
                                    return await this.ask({
                                        ...message,
                                        meta: {
                                            ...message.meta,
                                            passTrough: data.meta.passTrough,
                                            timeout: message?.meta?.timeout
                                        }
                                    });
                                },
                                notify: async(message) => {
                                    return await this.notify({
                                        ...message,
                                        meta: {
                                            passTrough: data.meta.passTrough,
                                            timeout: message?.meta?.timeout
                                        }
                                    });
                                }
                            }
                        )
                    );
                    mr.params = r;
                } catch (e) {
                    mr.params = undefined;
                    mr.error = e;
                    this.log('error', 'Methods', e);
                }
                if (!data.id) {
                    return;
                }
                if (data.meta.caller) {
                    mr.method = data.meta.caller;
                }
                return () => {
                    return wires.write(mr);
                };

            }
            this.log('debug', 'Not Found', data.method);
            return;
        }
    };
};

module.exports = Methods;
