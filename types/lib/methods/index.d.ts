/**
 * Init
 * @param {Object} init
 * @param {Symbol} init.tag
 * @returns {import('./types').Api}
 */
export function Methods({ tag }: {
    tag: Symbol;
}): import('./types').Api;
