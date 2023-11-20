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
    Packets: ({ config: { tag, waitTime } }?: {
        config: {
            waitTime: number;
            tag: Symbol;
        };
    }) => import("./lib/packets/types").Packet;
    merge: (packets: any) => any;
};
