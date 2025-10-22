/**
 * Gateway Server - Photon Server SDK for connecting to Gateway
 */

import type { Compiler } from "../core/compiler";
import { getServerServiceClient } from "../grpc/proto-loader";
import { GatewayBase, type GatewayConfig } from "./base";

export interface ActionInvocation {
    name: string;
    params: Record<string, any>;
}

export interface ToolInvocation {
    name: string;
    params: Record<string, any>;
}

export type ActionHandler = (invocation: ActionInvocation) => Promise<any>;
export type ToolHandler = (invocation: ToolInvocation) => Promise<any>;

interface PendingRegistration {
    resolve: () => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
}

export class GatewayServer extends GatewayBase {
    private compiler?: Compiler;
    private actionHandler?: ActionHandler;
    private toolHandler?: ToolHandler;
    private _isRegistered = false;
    private pendingRegistration?: PendingRegistration;

    protected constructor() {
        super();
    }

    static async connect(config: GatewayConfig): Promise<GatewayServer> {
        const gateway = new GatewayServer();
        gateway.config = config;
        gateway.client = gateway.createGrpcClient(getServerServiceClient());
        gateway.stream = gateway.client.Stream();
        gateway.setupStreamHandlers();
        gateway.isConnected = true;
        console.log(`[Gateway.Server] Connected to ${config.gatewayAddress}`);
        return gateway;
    }

    async register(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.stream) {
                reject(new Error("Stream is not available"));
                return;
            }

            const timer = setTimeout(() => {
                this.pendingRegistration = undefined;
                reject(new Error("Registration timeout"));
            }, 10000);

            this.pendingRegistration = { resolve, reject, timer };

            this.stream.write({
                register: {
                    project_id: this.config.projectId,
                    project_secret: this.config.projectSecret,
                    capabilities: ["compile"],
                },
            });
        });
    }

    async unregister(): Promise<void> {
        if (!this._isRegistered) return;

        this.stream?.write({
            unregister: {
                project_id: this.config.projectId,
                reason: "normal shutdown",
            },
        });

        this._isRegistered = false;
        console.log("[Gateway.Server] Unregistered");
    }

    setCompiler(compiler: Compiler): void {
        this.compiler = compiler;
        console.log("[Gateway.Server] Compiler registered");
    }

    onAction(handler: ActionHandler): void {
        this.actionHandler = handler;
        console.log("[Gateway.Server] Action handler registered");
    }

    onTool(handler: ToolHandler): void {
        this.toolHandler = handler;
        console.log("[Gateway.Server] Tool handler registered");
    }

    isRegistered(): boolean {
        return this._isRegistered;
    }

    override async disconnect(): Promise<void> {
        if (this._isRegistered) {
            await this.unregister().catch(console.error);
        }
        super.disconnect();
    }

    private handleRegisterResponse(response: any): void {
        if (!this.pendingRegistration) {
            console.warn("[Gateway.Server] Unexpected register response");
            return;
        }

        const { resolve, reject, timer } = this.pendingRegistration;
        clearTimeout(timer);
        this.pendingRegistration = undefined;

        if (!response.success) {
            reject(new Error(response.error || "Registration failed"));
            return;
        }

        this._isRegistered = true;
        console.log("[Gateway.Server] Registered successfully");
        resolve();
    }

    private async handleCompileContext(request: any): Promise<void> {
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
            const compiledContext = await this.compiler(context);

            this.stream?.write({
                compile_context_response: {
                    request_id,
                    success: true,
                    context: compiledContext,
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

    private async handleAction(request: any): Promise<void> {
        const { request_id, action_name, params } = request;

        if (!this.actionHandler) {
            this.stream?.write({
                run_actions_response: {
                    request_id,
                    success: false,
                    error: "No action handler registered",
                },
            });
            return;
        }

        try {
            const result = await this.actionHandler({ name: action_name, params });

            this.stream?.write({
                run_actions_response: {
                    request_id,
                    success: true,
                    result: typeof result === "string" ? result : JSON.stringify(result),
                },
            });

            console.log(`[Gateway.Server] Action ${action_name} executed successfully`);
        } catch (error) {
            this.stream?.write({
                run_actions_response: {
                    request_id,
                    success: false,
                    error: (error as Error).message,
                },
            });

            console.error(`[Gateway.Server] Action ${action_name} failed:`, error);
        }
    }

    private async handleTool(request: any): Promise<void> {
        const { request_id, tool_name, params } = request;

        if (!this.toolHandler) {
            this.stream?.write({
                call_tools_response: {
                    request_id,
                    success: false,
                    error: "No tool handler registered",
                },
            });
            return;
        }

        try {
            const result = await this.toolHandler({ name: tool_name, params });

            this.stream?.write({
                call_tools_response: {
                    request_id,
                    success: true,
                    result: typeof result === "string" ? result : JSON.stringify(result),
                },
            });

            console.log(`[Gateway.Server] Tool ${tool_name} executed successfully`);
        } catch (error) {
            this.stream?.write({
                call_tools_response: {
                    request_id,
                    success: false,
                    error: (error as Error).message,
                },
            });

            console.error(`[Gateway.Server] Tool ${tool_name} failed:`, error);
        }
    }

    private setupStreamHandlers(): void {
        if (!this.stream) return;

        this.stream.on("data", async (gatewayMessage: any) => {
            try {
                if (gatewayMessage.register_response) {
                    this.handleRegisterResponse(gatewayMessage.register_response);
                } else if (gatewayMessage.compile_context_request) {
                    await this.handleCompileContext(gatewayMessage.compile_context_request);
                } else if (gatewayMessage.unregister_response) {
                    console.log("[Gateway.Server] Unregister acknowledged");
                } else if (gatewayMessage.run_actions_request) {
                    await this.handleAction(gatewayMessage.run_actions_request);
                } else if (gatewayMessage.call_tools_request) {
                    await this.handleTool(gatewayMessage.call_tools_request);
                }
            } catch (error) {
                console.error("[Gateway.Server] Error handling message:", error);
            }
        });

        this.stream.on("end", () => {
            console.log("[Gateway.Server] Stream ended by server");
            this.handleDisconnect();
        });

        this.stream.on("error", (error: Error) => {
            console.error("[Gateway.Server] Stream error:", error);
            this.handleDisconnect();
        });
    }

    private handleDisconnect(): void {
        this._isRegistered = false;
        this.cleanupStream();

        if (!this.shouldReconnect()) {
            console.error("[Gateway.Server] Cannot reconnect: max attempts reached or manually disconnected");
            return;
        }

        const delay = this.getReconnectDelay();
        this.incrementReconnectAttempts();

        console.log(`[Gateway.Server] Disconnected, attempting reconnect #${this.reconnectAttempts} in ${delay}ms...`);

        setTimeout(async () => {
            if (!this.shouldReconnect()) return;

            try {
                this.stream = this.client.Stream();
                this.setupStreamHandlers();
                await this.register();
                this.resetReconnectAttempts();
                console.log("[Gateway.Server] Reconnected successfully");
            } catch (error) {
                console.error("[Gateway.Server] Reconnect failed:", error);
                this.handleDisconnect();
            }
        }, delay);
    }
}
