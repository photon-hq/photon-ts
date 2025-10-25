/**
 * Gateway Client - Target SDK for connecting to Gateway
 */

import { pushable } from "it-pushable";
import { fromStruct, nowTimestamp, targetService, toStruct } from "../grpc";
import type { MessageContent } from "../types";
import { GatewayBase } from "./base";

export class GatewayClient extends GatewayBase {
    override service: any = targetService();

    // streams
    messagesStream = pushable<any>({ objectMode: true });

    override postConnect(targetName: string): void {
        this.targetName = targetName;
        const metadata = this.generateMetadata();
        metadata.set("target-name", this.targetName);

        const incomingMessages = this.client.Messages(this.messagesStream, { metadata });

        (async () => {
            for await (const message of incomingMessages) {
                const content = fromStruct(message.message_content) as MessageContent;
                this.onMessageHandler?.(message.user_id, content);
            }
        })();
    }

    private targetName!: string;
    private onMessageHandler: ((userId: string, message: MessageContent) => void) | null = null;

    readonly Client = {
        registerOnMessageHandler: (handler: (userId: string, message: MessageContent) => void) => {
            this.onMessageHandler = handler;
        },
        
        sendMessage: async (userId: string, content: MessageContent, payload?: any) => {
            this.messagesStream.push({
                user_id: userId,
                message_content: toStruct(content),
                payload: payload ? toStruct(payload) : undefined,
                timestamp: nowTimestamp()
            });
        },

        getUserId: async (externalId: string): Promise<string> => {
            const metadata = this.generateMetadata();
            metadata.delete("project-secret");
            metadata.append("target-name", this.targetName);

            const response = (
                await this.client.Utils(
                    {
                        get_user_id: {
                            external_id: externalId,
                        },
                    },
                    { metadata },
                )
            ).get_user_id;

            if (response.success) {
                return response.user_id;
            } else {
                throw new Error(`Failed to get user ID: ${response.error}`);
            }
        },

        getExternalId: async (userId: string): Promise<string> => {
            const response = (
                await this.client.Utils({
                    get_external_id: {
                        user_id: userId,
                    },
                })
            ).get_external_id;

            if (response.success) {
                return response.external_id;
            } else {
                throw new Error(`Failed to get user ID: ${response.error}`);
            }
        },
    };
}
