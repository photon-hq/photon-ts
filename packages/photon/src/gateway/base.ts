/**
 * Gateway Base - Core connection logic for Server
 *
 * Base class for Photon Server to connect to Gateway
 * Handles gRPC client setup and connection management
 */

export interface GatewayConfig {
    gatewayAddress: string;
    projectId: string;
    projectSecret: string;
}

export const MAX_MESSAGE_SIZE = 10 * 1024 * 1024;

export abstract class GatewayBase {
    protected client: any;
    protected stream: any;
    protected readonly config!: GatewayConfig;
    protected isConnected = false;

    protected constructor() {}

    /**
     * Static factory method for elegant connection
     * Usage: const gateway = await Gateway.connect({ ... })
     *
     * Subclasses should override this method to provide their own implementation
     */
    static async connect(_config: any): Promise<GatewayBase> {
        throw new Error("connect() must be implemented by subclass");
    }

    /**
     * Check connection status
     */
    connected(): boolean {
        return this.isConnected;
    }

    /**
     * Disconnect and cleanup
     */
    disconnect(): void {
        if (this.stream) {
            this.stream.end();
            this.stream = null;
        }
        if (this.client) {
            this.client.close();
        }
        this.isConnected = false;
    }
}
