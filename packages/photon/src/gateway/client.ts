/**
 * Gateway Client - Target SDK for connecting to Gateway
 */

import { getTargetServiceClient } from "../grpc/proto-loader";
import { GatewayBase, type GatewayConfig } from "./base";

export interface InboundMessage {
    userId: string;
    messageContent: any;
    payload?: any;
}

export interface OutboundMessage {
    userId: string;
    messageContent: any;
}

export type MessageHandler = (message: OutboundMessage) => Promise<void> | void;

export class GatewayClient extends GatewayBase {
    private messageHandlers: Set<MessageHandler> = new Set();
    isStreamActive = false;

    protected constructor() {
        super();
    }

    static async connect(config: GatewayConfig): Promise<GatewayClient> {
        const gateway = new GatewayClient();
        gateway.config = config;
        gateway.client = gateway.createGrpcClient(getTargetServiceClient());
        gateway.isConnected = true;
        console.log(`[Gateway.Client] Connected to ${config.gatewayAddress}`);
        return gateway;
    }

    async startStream(): Promise<void> {
        if (this.isStreamActive) {
            console.warn("[Gateway.Client] Stream already active");
            return;
        }

        this.stream = this.client.Messages();
        this.setupStreamHandlers();
        this.isStreamActive = true;

        console.log("[Gateway.Client] Message stream started");
    }

    stopStream(): void {
        this.cleanupStream();
        this.isStreamActive = false;
        console.log("[Gateway.Client] Message stream stopped");
    }

    onMessage(handler: MessageHandler): () => void {
        this.messageHandlers.add(handler);
        return () => {
            this.messageHandlers.delete(handler);
        };
    }

    async send(message: InboundMessage): Promise<void> {
        try {
            if (!this.isStreamActive) {
                await this.startStream();
            }

            if (!this.stream) {
                throw new Error("Stream is not available");
            }

            this.stream.write({
                inbound: {
                    user_id: message.userId,
                    message_content: message.messageContent,
                    payload: message.payload,
                },
            });

            console.log(`[Gateway.Client] Sent message from user ${message.userId}`);
        } catch (error) {
            console.error("[Gateway.Client] Failed to send message:", error);
            throw error;
        }
    }

    async getUserId(externalId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.client.Utils(
                {
                    get_user_id: {
                        external_id: externalId,
                        project_id: this.config.projectId,
                    },
                },
                (error: any, response: any) => {
                    if (error) return reject(error);

                    const result = response.get_user_id;
                    if (!result?.success) {
                        return reject(new Error(result?.error || "Failed to get user ID"));
                    }

                    resolve(result.user_id);
                },
            );
        });
    }

    async getExternalId(userId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.client.Utils(
                {
                    get_external_id: {
                        user_id: userId,
                    },
                },
                (error: any, response: any) => {
                    if (error) return reject(error);

                    const result = response.get_external_id;
                    if (!result?.success) {
                        return reject(new Error(result?.error || "Failed to get external ID"));
                    }

                    resolve(result.external_id);
                },
            );
        });
    }

    override disconnect(): void {
        this.stopStream();
        super.disconnect();
    }

    private setupStreamHandlers(): void {
        if (!this.stream) return;

        this.stream.on("data", async (gatewayMessage: any) => {
            try {
                if (gatewayMessage.outbound) {
                    const protoMessage = gatewayMessage.outbound;

                    const message: OutboundMessage = {
                        userId: protoMessage.user_id,
                        messageContent: protoMessage.message_content,
                    };

                    for (const handler of this.messageHandlers) {
                        try {
                            await handler(message);
                        } catch (error) {
                            console.error("[Gateway.Client] Handler error:", error);
                        }
                    }

                    this.stream?.write({ received: true });
                } else if (gatewayMessage.completed) {
                    // Note: 'completed' field is currently unused by Gateway
                    // Reserved for future use to signal end of message processing
                    console.log("[Gateway.Client] Message processing completed");
                }
            } catch (error) {
                console.error("[Gateway.Client] Error handling message:", error);
            }
        });

        this.stream.on("end", () => {
            console.log("[Gateway.Client] Stream ended by server");
            this.handleDisconnect();
        });

        this.stream.on("error", (error: Error) => {
            console.error("[Gateway.Client] Stream error:", error);
            this.handleDisconnect();
        });
    }

    private handleDisconnect(): void {
        this.isStreamActive = false;
        this.cleanupStream();

        if (!this.shouldReconnect()) {
            console.error("[Gateway.Client] Cannot reconnect: max attempts reached or manually disconnected");
            return;
        }

        const delay = this.getReconnectDelay();
        this.incrementReconnectAttempts();

        console.log(`[Gateway.Client] Disconnected, attempting reconnect #${this.reconnectAttempts} in ${delay}ms...`);

        setTimeout(async () => {
            if (!this.shouldReconnect()) return;

            try {
                await this.startStream();
                this.resetReconnectAttempts();
                console.log("[Gateway.Client] Reconnected successfully");
            } catch (error) {
                console.error("[Gateway.Client] Reconnect failed:", error);
                this.handleDisconnect();
            }
        }, delay);
    }
}
