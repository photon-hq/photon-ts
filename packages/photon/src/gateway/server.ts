/**
 * Gateway Server - For Photon (Server) to connect to Gateway
 *
 * Server's responsibilities:
 * - Provide Compiler (AgentConfig)
 * - Execute tools when requested by Gateway
 *
 * Usage:
 * const gateway = await Gateway.connect({ ... })
 * await gateway.Server.register(compiler)
 * gateway.Server.registerInvokableHandler(async (invocation) => { ... })
 */

import * as grpc from "@grpc/grpc-js";
import { contextToProto, protoToContext } from "../utils";
import type { Compiler } from "../core/compiler";
import { getServerServiceClient } from "../grpc/proto-loader";
import { GatewayBase, type GatewayConfig, MAX_MESSAGE_SIZE } from "./base";

// Invokable types (for actions/tools)
export interface Invokable {
    name: string;
    params: Record<string, any>;
}

export type InvokableHandler = (invocation: Invokable) => Promise<any>;

const RECONNECT_DELAY_MS = 5000;
const SERVER_VERSION = "2.0.0";

class GatewayServer extends GatewayBase {
    private compiler?: Compiler;
    private heartbeatTimer?: NodeJS.Timeout;
    private isRegistered = false;
    private invokableHandler?: InvokableHandler;
    private stream: any;

    protected constructor() {
        super();
    }

    /**
     * Static factory method - The elegant way to connect
     *
     * Usage:
     * const gateway = await Gateway.connect({
     *     gatewayAddress: "localhost:50051",
     *     projectId: "my-project",
     *     projectSecret: "secret",
     * })
     */
    static override async connect(config: GatewayConfig): Promise<GatewayServer> {
        const gateway = new GatewayServer();
        const ServerServiceClient = getServerServiceClient();

        // Set config
        (gateway as any).config = config;

        // Create gRPC client
        gateway.client = new ServerServiceClient(config.gatewayAddress, grpc.credentials.createInsecure(), {
            "grpc.max_receive_message_length": MAX_MESSAGE_SIZE,
            "grpc.max_send_message_length": MAX_MESSAGE_SIZE,
        });

        // Initialize bidirectional stream
        gateway.stream = gateway.client.Stream();
        gateway.setupStreamHandlers();
        gateway.isConnected = true;

        console.log(`[Gateway] Connected to ${config.gatewayAddress}`);
        return gateway;
    }

    /**
     * Server namespace
     */
    readonly Server = {
        /**
         * Register with Gateway and provide compiler
         *
         * Usage:
         * await gateway.Server.register(myCompiler)
         */
        register: async (): Promise<void> => {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error("Registration timeout"));
                }, 10000);

                // Store resolver for register response
                const originalHandler = this.handleRegisterResponse.bind(this);
                this.handleRegisterResponse = async (response: any) => {
                    clearTimeout(timeout);
                    this.handleRegisterResponse = originalHandler;

                    if (!response.success) {
                        reject(new Error(response.error || "Registration failed"));
                        return;
                    }

                    this.isRegistered = true;

                    // Start heartbeat
                    if (response.heartbeat_interval) {
                        this.startHeartbeat(response.heartbeat_interval * 1000);
                    }

                    console.log("[Gateway.Server] Registered successfully");
                    resolve();
                };

                // Send registration
                this.stream?.write({
                    register: {
                        project_id: this.config.projectId,
                        project_secret: this.config.projectSecret,
                        server_version: SERVER_VERSION,
                        capabilities: ["compile"],
                    },
                });
            });
        },
        
        registerCompiler: (compiler: Compiler) => {
            this.compiler = compiler;
            console.log("[Gateway.Server] Compiler registered");
        },

        /**
         * Register handler for tool/action invocations
         */
        registerInvokableHandler: (handler: InvokableHandler): void => {
            this.invokableHandler = handler;
            console.log("[Gateway.Server] Tool handler registered");
        },

        /**
         * Unregister from Gateway
         */
        unregister: async (): Promise<void> => {
            if (!this.isRegistered) return;

            this.stream?.write({
                unregister: {
                    project_id: this.config.projectId,
                    reason: "normal shutdown",
                },
            });

            this.stopHeartbeat();
            this.isRegistered = false;
            console.log("[Gateway.Server] Unregistered");
        },
    };

    /**
     * Setup stream event handlers
     */
    private setupStreamHandlers(): void {
        if (!this.stream) return;

        // Handle messages from Gateway
        this.stream.on("data", async (gatewayMessage: any) => {
            try {
                // Register response
                if (gatewayMessage.register_response) {
                    await this.handleRegisterResponse(gatewayMessage.register_response);
                }

                // Heartbeat response
                else if (gatewayMessage.heartbeat_response) {
                    this.handleHeartbeatResponse(gatewayMessage.heartbeat_response);
                }

                // CompileContext request
                else if (gatewayMessage.compile_context_request) {
                    await this.handleCompileContextRequest(gatewayMessage.compile_context_request);
                }

                // Unregister response
                else if (gatewayMessage.unregister_response) {
                    console.log("[Gateway] Unregister acknowledged");
                }

                // RunActions request
                else if (gatewayMessage.run_actions_request) {
                    await this.handleInvokableRequest(gatewayMessage.run_actions_request);
                }

                // CallTools request
                else if (gatewayMessage.call_tools_request) {
                    await this.handleInvokableRequest(gatewayMessage.call_tools_request);
                }
            } catch (error) {
                console.error("[Gateway] Error handling message:", error);
            }
        });

        // Handle stream end
        this.stream.on("end", () => {
            console.log("[Gateway] Stream ended by server");
            this.handleDisconnect();
        });

        // Handle stream error
        this.stream.on("error", (error: Error) => {
            console.error("[Gateway] Stream error:", error);
            this.handleDisconnect();
        });
    }

    /**
     * Handle register response
     */
    private async handleRegisterResponse(response: any): Promise<void> {
        // Default handler (overridden during registration)
        console.log("[Gateway] Unexpected register response:", response);
    }

    /**
     * Send heartbeat
     */
    private sendHeartbeat(): void {
        if (!this.stream || !this.isRegistered) return;

        this.stream.write({
            heartbeat: {
                project_id: this.config.projectId,
                status: "healthy",
                metrics: {},
            },
        });
    }

    /**
     * Handle heartbeat response
     */
    private handleHeartbeatResponse(response: any): void {
        if (response.command === "reconnect") {
            console.log("[Gateway] Gateway requested reconnect");
            this.handleDisconnect();
        }
    }

    /**
     * Handle CompileContext request from Gateway
     */
    private async handleCompileContextRequest(request: any): Promise<void> {
        const { request_id, context } = request;

        if (!this.compiler) {
            this.stream?.write({
                compile_context_response: {
                    request_id,
                    success: false,
                    error: "Compiler not registered",
                },
            });
            return;
        }

        try {
            const internalContext = protoToContext(context);
            const compiledContext = await this.compiler(internalContext);

            this.stream?.write({
                compile_context_response: {
                    request_id,
                    success: true,
                    context: contextToProto(compiledContext),
                },
            });
        } catch (error) {
            this.stream?.write({
                compile_context_response: {
                    request_id,
                    success: false,
                    error: (error as Error).message,
                },
            });
        }
    }

    /**
     * Handle invokable request (actions/tools)
     */
    private async handleInvokableRequest(request: any): Promise<void> {
        const { request_id, action_name, tool_name, params } = request;
        const name = action_name || tool_name;
        const isAction = !!action_name;
        const responseType = isAction ? "run_actions_response" : "call_tools_response";

        if (!this.invokableHandler) {
            this.stream?.write({
                [responseType]: {
                    request_id,
                    success: false,
                    error: "No invokable handler registered",
                },
            });
            return;
        }

        try {
            const result = await this.invokableHandler({ name, params });

            this.stream?.write({
                [responseType]: {
                    request_id,
                    success: true,
                    result: typeof result === "string" ? result : JSON.stringify(result),
                },
            });

            console.log(`[Gateway] Invokable ${name} executed successfully`);
        } catch (error) {
            this.stream?.write({
                [responseType]: {
                    request_id,
                    success: false,
                    error: (error as Error).message,
                },
            });

            console.error(`[Gateway] Invokable ${name} failed:`, error);
        }
    }

    /**
     * Start heartbeat timer
     */
    private startHeartbeat(interval: number): void {
        this.stopHeartbeat();

        this.heartbeatTimer = setInterval(() => {
            this.sendHeartbeat();
        }, interval);

        console.log(`[Gateway] Heartbeat started (${interval}ms)`);
    }

    /**
     * Stop heartbeat timer
     */
    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }
    }

    /**
     * Handle disconnect and reconnect
     */
    private handleDisconnect(): void {
        this.isRegistered = false;
        this.stopHeartbeat();

        if (this.stream) {
            this.stream.removeAllListeners();
            this.stream = null;
        }

        // Only attempt reconnect if still connected (not manually disconnected)
        if (!this.isConnected) {
            return;
        }

        console.log("[Gateway] Disconnected, attempting to reconnect...");

        // Attempt reconnect
        setTimeout(async () => {
            if (this.isConnected) {
                try {
                    this.stream = this.client.Stream();
                    this.setupStreamHandlers();
                    
                    await this.Server.register();

                    if (this.compiler) {
                        this.Server.registerCompiler(this.compiler)
                    }

                    console.log("[Gateway] Reconnected successfully");
                } catch (error) {
                    console.error("[Gateway] Reconnect failed:", error);
                    this.handleDisconnect();
                }
            }
        }, RECONNECT_DELAY_MS);
    }

    /**
     * Override disconnect to cleanup properly
     */
    override disconnect(): void {
        this.stopHeartbeat();
        if (this.isRegistered) {
            this.Server.unregister().catch(console.error);
        }
        if (this.stream) {
            this.stream.end();
            this.stream = null;
        }
        super.disconnect();
    }
}

export { GatewayServer }