import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { z } from "zod";
import type { Target } from "../target.ts";
import { type Message, messageSchema } from "./types";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROTO_PATH = path.join(__dirname, "proto", "gateway.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const gatewayProto = protoDescriptor.photon.gateway;

export class GatewayBase {
    protected client: any;
    protected stream: any;
    protected api_key!: string;
    protected target: Target | null = null;

    protected constructor() {}

    static async connect<T extends GatewayBase>(
        this: new () => T,
        api_key: string,
        serverAddress = "localhost:50051",
    ): Promise<T> {
        // biome-ignore lint/complexity/noThisInStatic: <We use `this()` to get the proper version of gateway>
        const gateway = new this();

        gateway.api_key = api_key;

        gateway.client = new gatewayProto.GatewayService(serverAddress, grpc.credentials.createInsecure());

        await new Promise<void>((resolve, reject) => {
            const deadline = new Date();
            deadline.setSeconds(deadline.getSeconds() + 5);

            gateway.client.waitForReady(deadline, (error: Error | undefined) => {
                if (error) {
                    console.error("Failed to connect to gRPC server:", error);
                    reject(error);
                } else {
                    console.log("Connected to gRPC server");

                    gateway.stream = gateway.client.MessageStream();

                    gateway.stream.on("data", (streamMessage: any) => {
                        try {
                            const message = gateway.parseProtoMessage(streamMessage.message);
                            const result = z.safeParse(messageSchema, message);

                            if (result.success) {
                                gateway.onMessage(result.data);
                            } else {
                                console.error("Invalid message:", result.error);
                            }
                        } catch (error) {
                            console.error("Error parsing message:", error);
                        }
                    });

                    gateway.stream.on("error", (error: Error) => {
                        console.error("Stream error:", error);
                    });

                    gateway.stream.on("end", () => {
                        console.log("Stream ended");
                    });

                    resolve();
                }
            });
        });

        return gateway as T;
    }

    protected parseProtoMessage(protoMsg: any): Message {
        if (protoMsg.client) {
            const client = protoMsg.client;
            const messageContent = this.parseMessageContent(client.message_content);

            return {
                role: "client",
                userId: client.user_id,
                payload: JSON.parse(client.payload_json || "{}"),
                keysToPayloadMessage: client.keys_to_payload_message || [],
                ...messageContent,
            };
        } else if (protoMsg.server) {
            const server = protoMsg.server;
            const messageContent = this.parseMessageContent(server.message_content);

            return {
                role: "server",
                userId: server.user_id,
                ...messageContent,
            };
        }
        throw new Error("Invalid message type");
    }

    protected parseMessageContent(content: any): { type: "plain_text"; content: string } | { type: "drafting" } {
        if (content.plain_text) {
            return {
                type: "plain_text",
                content: content.plain_text.content,
            };
        } else if (content.drafting) {
            return {
                type: "drafting",
            };
        }
        throw new Error("Invalid message content type");
    }

    protected serializeMessage(message: Message): any {
        const messageContent = this.serializeMessageContent(message);

        if (message.role === "client") {
            return {
                client: {
                    user_id: message.userId,
                    payload_json: JSON.stringify(message.payload),
                    keys_to_payload_message: message.keysToPayloadMessage,
                    message_content: messageContent,
                },
            };
        } else {
            return {
                server: {
                    user_id: message.userId,
                    message_content: messageContent,
                },
            };
        }
    }

    protected serializeMessageContent(message: Message): any {
        if (message.type === "plain_text") {
            return {
                plain_text: {
                    content: message.content,
                },
            };
        } else {
            return {
                drafting: {},
            };
        }
    }

    private async onMessage(data: Message) {
        if (data.role === "server") {
            if (this.target) {
                this.target.onMessage(data);
            }
        }
    }

    disconnect() {
        if (this.stream) {
            this.stream.end();
        }
    }
}
