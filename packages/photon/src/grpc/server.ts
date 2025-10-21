import * as grpc from "@grpc/grpc-js";
import type {
    CompileContextHandler,
    CompileContextRequestType,
    GatewayMessageType,
    RunActionHandler,
    RunActionRequestType,
    ServerMessageType,
} from "../types/grpc";
import { getGatewayServiceClient } from "./proto-loader";

// Constants
const HEARTBEAT_TIMEOUT_MS = 10000;
const MAX_MESSAGE_SIZE = 10 * 1024 * 1024;
const KEEPALIVE_TIME_MS = 30000;
const KEEPALIVE_TIMEOUT_MS = 10000;
const MAX_RECONNECT_DELAY_MS = 60000;
const RECONNECT_BASE_DELAY_MS = 5000;
const RECONNECT_MIN_DELAY_MS = 1000;

export interface ServerServiceConfigType {
    // Gateway config
    gatewayAddress: string;
    projectId: string;
    projectSecret: string;

    // Handlers
    compileContext: CompileContextHandler;
    runAction?: RunActionHandler;
}

/**
 * Server Service
 *
 * Purpose:
 * - Provides AgentConfig compilation through CompileContext handler
 * - Provides action execution through RunAction handler
 * - Manages bidirectional stream connection to Gateway via gRPC
 *
 * Note: Server only provides AgentConfig and tools. For target connections,
 * a separate gRPC connection is required.
 */
export class ServerService {
    private readonly config: Required<Omit<ServerServiceConfigType, "runAction">> & {
        runAction?: RunActionHandler;
    };

    private gatewayClient: any;
    private stream: grpc.ClientDuplexStream<ServerMessageType, GatewayMessageType> | null = null;
    private heartbeatTimer?: NodeJS.Timeout;
    private reconnectTimer?: NodeJS.Timeout;
    private reconnectAttempts = 0;
    private isRunning = false;
    private isRegistered = false;

    constructor(config: ServerServiceConfigType) {
        this.config = {
            gatewayAddress: config.gatewayAddress,
            projectId: config.projectId,
            projectSecret: config.projectSecret,
            compileContext: config.compileContext,
            runAction: config.runAction,
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
     * Get Server capabilities based on config
     */
    private getCapabilities(): string[] {
        const capabilities: string[] = ["compile"];
        if (this.config.runAction) {
            capabilities.push("actions");
        }
        return capabilities;
    }

    /**
     * Start Server Service
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            throw new Error("Server Service is already running");
        }

        try {
            await this.connectToGateway();
            await this.register();

            this.isRunning = true;
            console.log("[ServerService] Started successfully");
        } catch (error) {
            console.error("[ServerService] Failed to start:", error);

            this.stopTimers();
            this.closeStream();
            this.closeGatewayClient();

            throw error;
        }
    }

    /**
     * Connect to Gateway and establish bidirectional stream
     */
    private async connectToGateway(): Promise<void> {
        const GatewayServiceClient = getGatewayServiceClient();
        this.gatewayClient = new GatewayServiceClient(
            this.config.gatewayAddress,
            grpc.credentials.createInsecure(),
            this.createGatewayClientOptions(),
        );

        // Create bidirectional stream
        this.stream = this.gatewayClient.Stream();

        // Set up stream event handlers
        this.setupStreamHandlers();

        console.log(`[ServerService] Connected to Gateway at ${this.config.gatewayAddress}`);
    }

    /**
     * Set up stream event handlers
     */
    private setupStreamHandlers(): void {
        if (!this.stream) return;

        // Handle messages from Gateway
        this.stream.on("data", async (gatewayMessage: GatewayMessageType) => {
            try {
                // Determine message type (oneof field)
                const messageType = gatewayMessage.register_response
                    ? "register_response"
                    : gatewayMessage.heartbeat_response
                        ? "heartbeat_response"
                        : gatewayMessage.compile_context_request
                            ? "compile_context_request"
                            : gatewayMessage.run_action_request
                                ? "run_action_request"
                                : gatewayMessage.send_message_response
                                    ? "send_message_response"
                                    : gatewayMessage.unregister_response
                                        ? "unregister_response"
                                        : "unknown";

                switch (messageType) {
                    case "register_response":
                        this.handleRegisterResponse(gatewayMessage.register_response!);
                        break;

                    case "heartbeat_response":
                        this.handleHeartbeatResponse(gatewayMessage.heartbeat_response!);
                        break;

                    case "compile_context_request":
                        await this.handleCompileContextRequest(gatewayMessage.compile_context_request!);
                        break;

                    case "run_action_request":
                        await this.handleRunActionRequest(gatewayMessage.run_action_request!);
                        break;

                    case "send_message_response":
                        // Message sent successfully, nothing to do
                        break;

                    case "unregister_response":
                        // Unregister acknowledged
                        break;

                    default:
                        console.warn("[ServerService] Unknown message type:", gatewayMessage);
                }
            } catch (error) {
                console.error("[ServerService] Error handling message:", error);
            }
        });

        // Handle stream end
        this.stream.on("end", () => {
            console.log("[ServerService] Stream ended by server");
            this.isRegistered = false;
            this.scheduleReconnect();
        });

        // Handle stream error
        this.stream.on("error", (error) => {
            console.error("[ServerService] Stream error:", error);
            this.isRegistered = false;
            this.scheduleReconnect();
        });
    }

    /**
     * Register with Gateway
     */
    private async register(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.stream) {
                reject(new Error("Stream not established"));
                return;
            }

            const registerTimeout = setTimeout(() => {
                reject(new Error("Registration timeout"));
            }, 10000);

            // Store resolve/reject for handleRegisterResponse
            const cleanup = () => {
                clearTimeout(registerTimeout);
            };

            (this as any)._registerResolve = (success: boolean, error?: string) => {
                cleanup();
                if (success) {
                    resolve();
                } else {
                    reject(new Error(error || "Registration failed"));
                }
            };

            try {
                this.stream.write({
                    register: {
                        project_id: this.config.projectId,
                        project_secret: this.config.projectSecret,
                        server_version: "1.0.0",
                        capabilities: this.getCapabilities(),
                    },
                });
            } catch (error) {
                cleanup();
                reject(new Error(`Failed to send register message: ${(error as Error).message}`));
            }
        });
    }

    /**
     * Handle register response from Gateway
     */
    private handleRegisterResponse(response: any): void {
        if (!response.success) {
            console.error("[ServerService] Registration failed:", response.error);
            if ((this as any)._registerResolve) {
                (this as any)._registerResolve(false, response.error);
                delete (this as any)._registerResolve;
            }
            return;
        }

        console.log("[ServerService] Registered successfully:");
        console.log(`  - Project: ${this.config.projectId}`);

        this.isRegistered = true;
        this.reconnectAttempts = 0;

        if (response.config?.heartbeat_interval) {
            this.startHeartbeat(response.config.heartbeat_interval);
        }

        if ((this as any)._registerResolve) {
            (this as any)._registerResolve(true);
            delete (this as any)._registerResolve;
        }
    }

    /**
     * Start heartbeat timer
     */
    private startHeartbeat(interval: number): void {
        this.heartbeatTimer = setInterval(() => {
            this.sendHeartbeat().catch((error) => {
                console.error("[ServerService] Heartbeat failed:", error);
            });
        }, interval * 1000);
    }

    /**
     * Send heartbeat to Gateway
     */
    private async sendHeartbeat(): Promise<void> {
        if (!this.stream || !this.isRegistered) {
            throw new Error("Not connected or not registered");
        }

        try {
            this.stream.write({
                heartbeat: {
                    project_id: this.config.projectId,
                    status: "healthy",
                    metrics: {},
                },
            });
        } catch (error) {
            throw new Error(`Failed to send heartbeat: ${(error as Error).message}`);
        }
    }

    /**
     * Handle heartbeat response from Gateway
     */
    private handleHeartbeatResponse(response: any): void {
        if (response.command === "reconnect") {
            console.log("[ServerService] Gateway requested reconnect");
            this.scheduleReconnect();
        }
    }

    /**
     * Handle CompileContext request from Gateway
     */
    private async handleCompileContextRequest(request: CompileContextRequestType): Promise<void> {
        try {
            const response = await this.config.compileContext(request);

            if (this.stream) {
                this.stream.write({
                    compile_context_response: response,
                });
            }
        } catch (error) {
            console.error("[ServerService] CompileContext error:", error);

            if (this.stream) {
                this.stream.write({
                    compile_context_response: {
                        request_id: request.request_id,
                        success: false,
                        error: (error as Error).message,
                    },
                });
            }
        }
    }

    /**
     * Handle RunAction request from Gateway
     */
    private async handleRunActionRequest(request: RunActionRequestType): Promise<void> {
        if (!this.config.runAction) {
            console.warn("[ServerService] RunAction not implemented");
            if (this.stream) {
                this.stream.write({
                    run_action_response: {
                        request_id: request.request_id,
                        success: false,
                        error: "RunAction not implemented",
                    },
                });
            }
            return;
        }

        try {
            const response = await this.config.runAction(request);

            if (this.stream) {
                this.stream.write({
                    run_action_response: response,
                });
            }
        } catch (error) {
            console.error("[ServerService] RunAction error:", error);

            if (this.stream) {
                this.stream.write({
                    run_action_response: {
                        request_id: request.request_id,
                        success: false,
                        error: (error as Error).message,
                    },
                });
            }
        }
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
        if (!this.isRunning || this.reconnectTimer) {
            return;
        }

        // Stop heartbeat during reconnect
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }

        // Close existing stream and client
        this.closeStream();
        this.closeGatewayClient();

        const delay = this.calculateReconnectDelay();
        const attemptNum = this.reconnectAttempts + 1;

        console.log(`[ServerService] Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${attemptNum})`);

        this.reconnectTimer = setTimeout(async () => {
            this.reconnectTimer = undefined;
            try {
                await this.connectToGateway();
                await this.register();
                console.log("[ServerService] Reconnected successfully");
            } catch (error) {
                console.error("[ServerService] Reconnect failed:", error);
                this.reconnectAttempts++;
                this.scheduleReconnect();
            }
        }, delay);
    }

    /**
     * Send message to user via Gateway
     */
    async sendMessage(
        userId: string,
        message: { role: string; content: string; metadata?: Record<string, string> },
    ): Promise<void> {
        if (!this.stream || !this.isRegistered) {
            throw new Error("Not connected or not registered");
        }

        try {
            this.stream.write({
                send_message: {
                    user_id: userId,
                    message: {
                        role: message.role,
                        content: message.content,
                        timestamp: new Date().toISOString(),
                        metadata: message.metadata || {},
                    },
                },
            });
        } catch (error) {
            throw new Error(`Failed to send message: ${(error as Error).message}`);
        }
    }

    /**
     * Unregister from Gateway
     */
    private async unregister(reason: string = "normal shutdown"): Promise<void> {
        if (!this.stream || !this.isRegistered) {
            return;
        }

        try {
            this.stream.write({
                unregister: {
                    project_id: this.config.projectId,
                    reason,
                },
            });

            console.log("[ServerService] Unregistered successfully");
            console.log(`  - Project: ${this.config.projectId}`);
            console.log(`  - Reason: ${reason}`);
        } catch (error) {
            console.warn(`[ServerService] Failed to send unregister: ${(error as Error).message}`);
        }
    }

    /**
     * Stop Server Service
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        console.log("[ServerService] Stopping...");

        this.stopTimers();

        // Unregister from Gateway
        try {
            await this.unregister("normal shutdown");
            // Wait a bit for message to be sent
            await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
            console.warn("[ServerService] Failed to unregister:", error);
        }

        this.closeStream();
        this.closeGatewayClient();

        this.isRunning = false;
        console.log("[ServerService] Stopped");
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
     * Close stream
     */
    private closeStream(): void {
        if (this.stream) {
            try {
                this.stream.end();
            } catch (error) {
                console.warn("[ServerService] Error closing stream:", error);
            }
            this.stream = null;
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
                console.warn("[ServerService] Error closing gateway client:", error);
            }
        }
    }

    /**
     * Check if service is running
     */
    getIsRunning(): boolean {
        return this.isRunning;
    }

    /**
     * Check if registered with Gateway
     */
    getIsRegistered(): boolean {
        return this.isRegistered;
    }
}
