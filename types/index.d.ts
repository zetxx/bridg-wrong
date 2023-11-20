export let Router: ({ config, wires: w }: {
    config: any;
    wires: any;
}) => {
    start(): Promise<any[]>;
};
export let Methods: typeof import("./lib/methods");
export let Packets: {
    Packet: ({ waitTime, tag }: {
        waitTime: number;
        tag: Symbol;
    }) => Function;
    Packets: ({ config: { packet: { waitTime }, tag } }?: {
        config: {
            waitTime: number;
            tag: Symbol;
        };
    }) => import("./lib/packets/types").Api;
    merge: (packets: import("./lib/packets/types").message[]) => import("./lib/packets/types").message;
};
