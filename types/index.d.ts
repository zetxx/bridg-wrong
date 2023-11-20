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
    }) => import("./lib/packets/types").Packet;
    Packets: ({ config: { tag, waitTime } }?: {
        config?: {
            tag: any;
            waitTime?: number;
        };
    }) => {
        add({ config, header: { method, trace, match } }: {
            config: any;
            header?: {
                method: any;
                trace: any;
                match: any;
            };
        }): any;
        find({ idx, tag: curtag }?: {
            idx: any;
            tag?: any;
        }): any;
        fulfill(packet: any): (payload?: {}) => void;
        len(): number;
        acquire({ payload, header, match, config }: {
            payload: any;
            header: any;
            match: any;
            config: any;
        }): any;
        destroy(): void[];
    };
    merge: (packets: any) => any;
};
