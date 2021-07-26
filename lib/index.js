const Bridge = require('./bridge');

module.exports = {
    base: Bridge,
    builder: ({
        external: {build: externalBuild = []} = {},
        internal: {build: internalBuild = []} = {}
    } = {}) => {
        const external = new (externalBuild
            .reduce(
                (prevNode, cur) => cur({prevNode}),
                Bridge
            ));
        const internal = new (internalBuild
            .reduce(
                (prevNode, cur) => cur({prevNode}),
                Bridge
            ));

        return {
            async start() {
                await external.start({other: internal});
                await internal.start({other: external});
            },
            external: {
                method: {
                    add: external.method.add
                }
            },
            internal: {
                method: {
                    add: internal.method.add
                }
            }
        };
    }
};
