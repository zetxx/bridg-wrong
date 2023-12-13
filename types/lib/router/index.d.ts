export = Router;
declare function Router({ config, wires: w }: {
    config: any;
    wires: any;
}): {
    start(): Promise<any[]>;
};
