import * as grpc from "@grpc/grpc-js";
import type {
    CompileContextHandler,
    CompileContextRequestType,
    CompileContextResponseType,
    RegisterRequestType,
    RegisterResponseType,
    RunActionHandler,
    RunActionRequestType,
    RunActionResponseType,
    SendMessageRequestType,
    SendMessageResponseType,
    UnregisterRequestType,
    UnregisterResponseType,
} from "../types/grpc";
import { getGatewayServiceClient, getSDKServiceDefinition } from "./proto-loader";

// Constants
const REQUEST_TIMEOUT_MS = 30000;
const HEARTBEAT_TIMEOUT_MS = 10000;
const MAX_MESSAGE_SIZE = 10 * 1024 * 1024;
const KEEPALIVE_TIME_MS = 30000;
const KEEPALIVE_TIMEOUT_MS = 10000;
const MAX_RECONNECT_DELAY_MS = 60000;
const RECONNECT_BASE_DELAY_MS = 5000;
const RECONNECT_MIN_DELAY_MS = 1000;

export interface SDKServiceConfigType {
    // Server config
    port: number;
    host?: string;

    // Gateway config
    gatewayAddress: string;
    projectId: string;
    token: string;

    // SDK public address for registration
    publicAddress?: string;

    // Handlers
    compileContext: CompileContextHandler;
    runAction?: RunActionHandler;
}

export class SDKService {
    private readonly config: Required<Omit<SDKServiceConfigType, "runAction" | "publicAddress">> & {
        runAction?: RunActionHandler;
        publicAddress?: string;
    };
    private readonly server: grpc.Server;
    private readonly instanceId: string;

    private gatewayClient: any;
    private heartbeatTimer?: NodeJS.Timeout;
    private reconnectTimer?: NodeJS.Timeout;
    private reconnectAttempts = 0;
    private isRunning = false;

    constructor(config: SDKServiceConfigType) {
        const host = config.host ?? "0.0.0.0";

        if (host === "0.0.0.0" && !config.publicAddress) {
            console.warn(
                "[SDKService] Warning: host is 0.0.0.0 but no publicAddress provided. " +
                    "Gateway may not be able to reach this SDK.",
            );
        }

        this.config = {
            port: config.port,
            host,
            gatewayAddress: config.gatewayAddress,
            projectId: config.projectId,
            token: config.token,
            publicAddress: config.publicAddress,
            compileContext: config.compileContext,
            runAction: config.runAction,
        };

        this.instanceId = this.generateInstanceId(config.projectId);
        this.server = new grpc.Server(this.createServerOptions());
        this.registerServerService();
    }

    /**
     * Generate unique instance ID
     */
    private generateInstanceId(projectId: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `${projectId}-${timestamp}-${random}`;
    }

    /**
     * Create gRPC server options
     */
    private createServerOptions(): grpc.ServerOptions {
        return {
            "grpc.max_receive_message_length": MAX_MESSAGE_SIZE,
            "grpc.max_send_message_length": MAX_MESSAGE_SIZE,
            "grpc.keepalive_time_ms": KEEPALIVE_TIME_MS,
            "grpc.keepalive_timeout_ms": KEEPALIVE_TIMEOUT_MS,
            "grpc.keepalive_permit_without_calls": 1,
        };
    }

    /**
     * Create Gateway client options
     */
    private createGatewayClientOptions(): grpc.ClientOptions {
        return {
            "grpc.max_receive_message_length": MAX_MESSAGE_SIZE,
            "grpc.max_send_message_length": MAX_MESSAGE_SIZE,
            "grpc.keepalive_time_ms": KEEPALIVE_TIME_MS,
            "grpc.keepalive_timeout_ms": KEEPALIVE_TIMEOUT_MS,
            "grpc.initial_reconnect_backoff_ms": 1000,
            "grpc.max_reconnect_backoff_ms": 30000,
            "grpc.enable_retries": 1,
        };
    }

    /**
     * Register SDK Server service
     */
    private registerServerService(): void {
        const serviceDefinition = getSDKServiceDefinition();

        this.server.addService(serviceDefinition, {
            CompileContext: this.handleCompileContext.bind(this),
            RunAction: this.handleRunAction.bind(this),
        });
    }

    /**
     * Handle CompileContext request from Gateway
     */
    private async handleCompileContext(
        call: grpc.ServerUnaryCall<CompileContextRequestType, CompileContextResponseType>,
        callback: grpc.sendUnaryData<CompileContextResponseType>,
    ): Promise<void> {
        try {
            if (!call.request || !call.request.context) {
                callback({
                    code: grpc.status.INVALID_ARGUMENT,
                    message: "Invalid request: context is required",
                });
                return;
            }

            const response = await this.config.compileContext(call.request);
            callback(null, response);
        } catch (error) {
            console.error("[SDKService] CompileContext error:", error);
            callback({
                code: grpc.status.INTERNAL,
                message: (error as Error).message,
            });
        }
    }

    /**
     * Handle RunAction request from Gateway
     */
    private async handleRunAction(
        call: grpc.ServerUnaryCall<RunActionRequestType, RunActionResponseType>,
        callback: grpc.sendUnaryData<RunActionResponseType>,
    ): Promise<void> {
        if (!this.config.runAction) {
            callback({
                code: grpc.status.UNIMPLEMENTED,
                message: "RunAction not implemented",
            });
            return;
        }

        try {
            if (!call.request || !call.request.action_name) {
                callback({
                    code: grpc.status.INVALID_ARGUMENT,
                    message: "Invalid request: action_name is required",
                });
                return;
            }

            const response = await this.config.runAction(call.request);
            callback(null, response);
        } catch (error) {
            console.error("[SDKService] RunAction error:", error);
            callback({
                code: grpc.status.INTERNAL,
                message: (error as Error).message,
            });
        }
    }

    /**
     * Start SDK Service
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            throw new Error("SDK Service is already running");
        }

        try {
            await this.startServer();
            await this.connectToGateway();
            await this.register();

            this.isRunning = true;
            console.log("[SDKService] Started successfully");
        } catch (error) {
            // Rollback on failure
            console.error("[SDKService] Failed to start:", error);

            this.stopTimers();
            this.closeGatewayClient();

            await new Promise<void>((resolve) => {
                this.server.tryShutdown(() => resolve());
            });

            throw error;
        }
    }

    /**
     * Start gRPC Server
     */
    private async startServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            const address = `${this.config.host}:${this.config.port}`;

            this.server.bindAsync(
                address,
                grpc.ServerCredentials.createInsecure(),
                (error: Error | null, port: number) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    this.server.start();
                    console.log(`[SDKService] Server listening on ${address} (port: ${port})`);
                    resolve();
                },
            );
        });
    }

    /**
     * Connect to Gateway
     */
    private async connectToGateway(): Promise<void> {
        const GatewayServiceClient = getGatewayServiceClient();
        this.gatewayClient = new GatewayServiceClient(
            this.config.gatewayAddress,
            grpc.credentials.createInsecure(),
            this.createGatewayClientOptions(),
        );
        console.log(`[SDKService] Connected to Gateway at ${this.config.gatewayAddress}`);
    }

    /**
     * Get SDK capabilities based on config
     */
    private getCapabilities(): string[] {
        const capabilities: string[] = ["compile"];
        if (this.config.runAction) {
            capabilities.push("actions");
        }
        return capabilities;
    }

    /**
     * Register with Gateway
     */
    private async register(): Promise<void> {
        return new Promise((resolve, reject) => {
            const sdkAddress = this.config.publicAddress ?? `${this.config.host}:${this.config.port}`;
            const deadline = new Date(Date.now() + REQUEST_TIMEOUT_MS);

            const request: RegisterRequestType = {
                project_id: this.config.projectId,
                token: this.config.token,
                instance_id: this.instanceId,
                sdk_version: "1.0.0",
                sdk_address: sdkAddress,
                capabilities: this.getCapabilities(),
            };

            this.gatewayClient.Register(
                request,
                { deadline },
                (error: Error | null, response: RegisterResponseType) => {
                    if (error) {
                        reject(new Error(`Registration failed: ${error.message}`));
                        return;
                    }

                    if (!response || !response.success) {
                        reject(new Error(response?.error || "Registration failed"));
                        return;
                    }

                    if (!response.config || !response.config.heartbeat_interval) {
                        reject(new Error("Invalid registration response: missing config"));
                        return;
                    }

                    console.log("[SDKService] Registered successfully:");
                    console.log(`  - Project: ${this.config.projectId}`);
                    console.log(`  - Instance: ${this.instanceId}`);

                    this.reconnectAttempts = 0;
                    this.startHeartbeat(response.config.heartbeat_interval);
                    resolve();
                },
            );
        });
    }

    /**
     * Start heartbeat timer
     */
    private startHeartbeat(interval: number): void {
        this.heartbeatTimer = setInterval(() => {
            this.sendHeartbeat().catch((error) => {
                console.error("[SDKService] Heartbeat failed:", error);
                this.scheduleReconnect();
            });
        }, interval * 1000);
    }

    /**
     * Send heartbeat to Gateway
     */
    private async sendHeartbeat(): Promise<void> {
        return new Promise((resolve, reject) => {
            const deadline = new Date(Date.now() + HEARTBEAT_TIMEOUT_MS);

            this.gatewayClient.Heartbeat(
                {
                    instance_id: this.instanceId,
                    status: "healthy",
                    metrics: {},
                },
                { deadline },
                (error: Error | null, response: any) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    if (response?.command === "reconnect") {
                        console.log("[SDKService] Gateway requested reconnect");
                        this.scheduleReconnect();
                    }

                    resolve();
                },
            );
        });
    }

    /**
     * Calculate reconnect delay with exponential backoff and jitter
     */
    private calculateReconnectDelay(): number {
        const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** this.reconnectAttempts, MAX_RECONNECT_DELAY_MS);

        // Add jitter (±25%) to prevent thundering herd
        const jitter = delay * 0.25 * (Math.random() * 2 - 1);
        return Math.max(RECONNECT_MIN_DELAY_MS, delay + jitter);
    }

    /**
     * Schedule reconnect with exponential backoff
     */
    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            return;
        }

        // Stop heartbeat during reconnect
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }

        const delay = this.calculateReconnectDelay();
        const attemptNum = this.reconnectAttempts + 1;

        console.log(`[SDKService] Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${attemptNum})`);

        this.reconnectTimer = setTimeout(async () => {
            this.reconnectTimer = undefined;
            try {
                await this.connectToGateway();
                await this.register();
                console.log("[SDKService] Reconnected successfully");
            } catch (error) {
                console.error("[SDKService] Reconnect failed:", error);
                this.reconnectAttempts++;
                this.scheduleReconnect();
            }
        }, delay);
    }

    /**
     * Send message to user via Gateway with timeout
     */
    async sendMessage(
        userId: string,
        message: { role: string; content: string; metadata?: Record<string, string> },
    ): Promise<string> {
        if (!this.gatewayClient) {
            throw new Error("Gateway client not initialized");
        }

        return new Promise((resolve, reject) => {
            const deadline = new Date(Date.now() + REQUEST_TIMEOUT_MS);

            const request: SendMessageRequestType = {
                user_id: userId,
                message: {
                    role: message.role,
                    content: message.content,
                    timestamp: new Date().toISOString(),
                    metadata: message.metadata || {},
                },
            };

            this.gatewayClient.SendMessage(
                request,
                { deadline },
                (error: Error | null, response: SendMessageResponseType) => {
                    if (error) {
                        reject(new Error(`SendMessage failed: ${error.message}`));
                        return;
                    }

                    if (!response || !response.success) {
                        reject(new Error(response?.error || "Send message failed"));
                        return;
                    }

                    resolve(response.message_id);
                },
            );
        });
    }

    /**
     * Unregister from Gateway
     */
    private async unregister(reason: string = "normal shutdown"): Promise<void> {
        if (!this.gatewayClient) {
            return;
        }

        return new Promise((resolve) => {
            const deadline = new Date(Date.now() + 5000);
            const request: UnregisterRequestType = {
                instance_id: this.instanceId,
                reason,
            };

            this.gatewayClient.Unregister(
                request,
                { deadline },
                (error: Error | null, response: UnregisterResponseType) => {
                    if (error) {
                        console.warn(`[SDKService] Unregister failed: ${error.message}`);
                        resolve();
                        return;
                    }

                    if (!response || !response.success) {
                        console.warn(`[SDKService] Unregister failed: ${response?.error || "Unknown error"}`);
                        resolve();
                        return;
                    }

                    console.log("[SDKService] Unregistered successfully");
                    console.log(`  - Instance: ${this.instanceId}`);
                    console.log(`  - Reason: ${reason}`);
                    resolve();
                },
            );
        });
    }

    /**
     * Stop SDK Service
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        console.log("[SDKService] Stopping...");

        this.stopTimers();

        // Unregister from Gateway
        try {
            await this.unregister("normal shutdown");
        } catch (error) {
            console.warn("[SDKService] Failed to unregister:", error);
        }

        this.closeGatewayClient();

        // Shutdown server
        return new Promise((resolve) => {
            this.server.tryShutdown(() => {
                this.isRunning = false;
                console.log("[SDKService] Stopped");
                resolve();
            });
        });
    }

    /**
     * Stop all timers
     */
    private stopTimers(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
    }

    /**
     * Close Gateway client
     */
    private closeGatewayClient(): void {
        if (this.gatewayClient) {
            try {
                this.gatewayClient.close();
            } catch (error) {
                console.warn("[SDKService] Error closing gateway client:", error);
            }
        }
    }

    /**
     * Check if service is running
     */
    getIsRunning(): boolean {
        return this.isRunning;
    }
}
