/**
 * @typedef {Object} AddValue
 * @property {import('../types.js').messageFn} fn
 */
/**
 * @constant {Objcet} errors
 * @property {Error} errors.TimeOut
*/
const errors = {
    TimeOut: new Error('TimeOut')
};

let uidCounter = 0;
let callerCounter = 0;
let requestCounter = 0;

/**
 * Methods bootstrap
 * @property {object} props
 * @property {import('../wires/types.js').Api} props.wires
 * @property {Map<string, AddValue>} props.list
 * @property {any} props.config
 * @returns {import('./types.js').Api}
 */
const Methods = ({
    wires,
    list: externalList,
    config
}) => {
    /** @constant {Map<string, AddValue>} */
    const list = (externalList || new Map());

    return class methods {
        constructor () {
            wires.register((...args) => this.test(...args));
            this.namespace = config?.namespace || '';
            this.uid = ++uidCounter;
        }
        /**
         * Log
         * @param {any} arg
         * @returns {void}
         */
        log(level, ...rest) {
            console[level] && console[level](...[this.namespace, ...rest]);
        }
        tempMethodName(data) {
            return [this.namespace, this.uid, ++callerCounter, data.id].filter(Boolean).join('.');
        }
        /**
         * Add method to method list
         * @param {object} param
         * @param {string} param.name
         * @param {import('../types.js').messageFn} param.fn
         * @returns {void}
         */
        add({name: key, fn}) {
            this.log('debug', 'Add', key);
            list.set(key, {fn});
            return;
        }
        /**
         * remove
         * @param {object} param
         * @param {string} param.name
         * @returns {void}
         */
        remove({name: key}) {
            this.log('debug', 'Remove', key);
            list.delete(key);
        }
        /**
         * find
         * @param {object} param
         * @param {string} param.name
         * @returns {import('../types.js').messageFn}
         */
        find({name: key}) {
            this.log('debug', 'Find', key);
            return list.get(key);
        }
        /**
         * ask
         * @param {import('../types.js').message} message
         * @returns {any}
         */
        async ask(message) {
            return await this.send({
                ...message,
                id: ++requestCounter
            });
        }
        /**
         * notify
         * @param {import('../types.js').message} message
         * @returns {any}
         */
        async notify(message) {
            return this.send({
                ...message,
                id: undefined
            });
        }
        /**
         * send
         * @param {import('../types.js').message} message
         * @returns {any}
         */
        async send(message) {
            return await new Promise((resolve, reject) => {
                if (message.id) { // id exists = request, else, notification
                    if (!message.meta) {
                        message.meta = {};
                    }
                    this.log('debug', 'Send Request', message);
                    const listenMethod = this.tempMethodName(message);
                    message.meta.caller = listenMethod;
                    const to = setTimeout(
                        () => {
                            this.remove({name: listenMethod});
                            reject({error: errors.TimeOut});
                        },
                        (message?.meta?.timeout || config?.timeout || 3000)
                    );
                    // add response method
                    this.add({
                        name: listenMethod,
                        fn: (data) => {
                            clearTimeout(to);
                            this.remove({name: listenMethod});
                            if (data.error) {
                                return reject(data);
                            }
                            resolve(data);
                        }
                    });
                    wires.write(message);
                } else {
                    this.log('debug', 'Send Notification', message);
                    wires.write(message);
                    resolve();
                }
            });
        }
        /**
         * test
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
                                            passTrough: data.meta.passTrough,
                                            timeout: message?.meta?.timeout
                                        }
                                    });
                                },
                                ask: async(message) => {
                                    return await this.ask({
                                        ...message,
                                        meta: {
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
