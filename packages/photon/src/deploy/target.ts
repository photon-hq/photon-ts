/**
 * Target - Base class for SDK deployment targets
 */

import type { SDKService } from "../grpc/sdk-service";

export interface _Target {
    start(projectKey: string, gatewayAddress: string): Promise<boolean>;
}

export interface MessageType {
    role: string;
    content: string;
    metadata?: Record<string, string>;
}

export abstract class Target implements _Target {
    protected sdkService?: SDKService;

    /**
     * Start the target and connect to Gateway
     */
    async start(_projectKey: string, _gatewayAddress: string): Promise<boolean> {
        // Target is now deprecated - use Deployable.deploy() instead
        throw new Error(
            "Target class is deprecated. Use Deployable.deploy() instead:\n" +
                'await agent.deploy(projectKey, { gatewayAddress: "..." })',
        );
    }

    /**
     * Register user (deprecated)
     */
    async registerUser(_userId: string): Promise<void> {
        // No longer needed - users are managed by Gateway
        console.warn("registerUser is deprecated and no longer needed");
    }

    /**
     * Send message to user via Gateway
     */
    protected async sendMessage(userId: string, message: MessageType): Promise<string> {
        if (!this.sdkService) {
            throw new Error("SDK Service not initialized");
        }

        return this.sdkService.sendMessage(userId, message);
    }

    /**
     * Message handler (implement in subclass)
     */
    abstract onMessage(data: MessageType): void;

    /**
     * Post-start hook (implement in subclass)
     */
    abstract postStart(): Promise<void>;
}
