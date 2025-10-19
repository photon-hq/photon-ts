export class GatewayBase {
    protected project_key!: string;

    protected constructor() {}

    static async connect<T extends GatewayBase>(this: new () => T, project_key: string): Promise<T> {
        // biome-ignore lint/complexity/noThisInStatic: <We use `this()` to get the proper version of gateway>
        const gateway = new this();

        gateway.project_key = project_key;

        // TODO: Connect to the Gateway

        return gateway as T;
    }
}
