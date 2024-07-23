export = Methods;
/**
 * Methods bootstrap
 * @property {object} props
 * @property {import('../wires/types.js').Api} props.wires
 * @property {Map<string, AddValue>} props.externalList
 * @property {any} props.config
 * @returns {import('./types.js').Api}
 */
declare function Methods({ wires, list: externalList, config }: {
    wires: any;
    list: any;
    config?: {};
}): import("./types.js").Api;
