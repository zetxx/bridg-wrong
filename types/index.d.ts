export let Wires: () => import("./lib/wires/types").Api;
export let Methods: ({ wires, list: externalList, config }: {
    wires: any;
    list: any;
    config?: {};
}) => import("./lib/methods/types").Api;
