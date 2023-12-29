export = Methods;
/**
 * Methods bootstrap
 * @property {object} props
 * @property {import('../wires/types.js').Api} props.wires
 * @property {Map<string, AddValue>} props.list
 * @property {any} props.config
 * @returns {import('./types.js').Api}
 */
declare function Methods({ wires, list: externalList, config }: {
    wires: any;
    list: any;
    config?: {};
}): any;
declare namespace Methods {
    export { AddValue };
}
type AddValue = {
    fn: import('../types.js').messageFn;
};
