/**
 * Init
 * @param {Object} init
 * @param {Object} init.config
 * @param {Symbol} init.config.tag
 * @returns {import('./types').Api}
 */
export function Methods({ config: { tag } }: {
    config: {
        tag: Symbol;
    };
}): import('./types').Api;
