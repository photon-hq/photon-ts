/**
 * Gateway Base Class
 */

import * as grpc from "@grpc/grpc-js";

export interface GatewayConfig {
    gatewayAddress: string;
    projectId: string;
    projectSecret: string;
}

const MAX_RECONNECT_ATTEMPTS = 10;

export abstract class GatewayBase {
    config!: GatewayConfig;
    client: any;
    stream: any;
    isConnected = false;
    reconnectAttempts = 0;

    protected constructor() {}

    protected shouldReconnect(): boolean {
        return this.isConnected && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS;
    }

    /**
     * Create gRPC client with proper credentials and options
     */
    protected createGrpcClient(ClientClass: any): any {
        // Determine if SSL should be used based on address
        const useSSL =
            !this.config.gatewayAddress.startsWith("localhost") && 
            !this.config.gatewayAddress.startsWith("127.0.0.1") &&
            !this.config.gatewayAddress.startsWith("0.0.0.0") 

        const credentials = useSSL ? grpc.credentials.createSsl() : grpc.credentials.createInsecure();

        return new ClientClass(this.config.gatewayAddress, credentials, {
            "grpc.max_receive_message_length": 10 * 1024 * 1024,
            "grpc.max_send_message_length": 10 * 1024 * 1024,
            "grpc.keepalive_time_ms": 30000,
            "grpc.keepalive_timeout_ms": 10000,
            "grpc.keepalive_permit_without_calls": 1,
        });
    }

    connected(): boolean {
        return this.isConnected;
    }

    /**
     * Calculate reconnection delay with exponential backoff
     */
    protected getReconnectDelay(): number {
        return Math.min(5000 * 2 ** this.reconnectAttempts, 60000);
    }

    /**
     * Increment reconnection attempts counter
     */
    protected incrementReconnectAttempts(): void {
        this.reconnectAttempts++;
    }

    /**
     * Reset reconnection attempts counter
     */
    resetReconnectAttempts(): void {
        this.reconnectAttempts = 0;
    }

    /**
     * Clean up stream resources
     */
    protected cleanupStream(): void {
        if (this.stream) {
            this.stream.removeAllListeners();
            this.stream.end();
            this.stream = null;
        }
    }

    disconnect(): void {
        this.isConnected = false;
        this.cleanupStream();
        if (this.client) {
            this.client.close();
            this.client = undefined;
        }
    }
}
