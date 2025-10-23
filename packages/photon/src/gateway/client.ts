/**
 * Gateway Client - Target SDK for connecting to Gateway
 */

import { pushable } from "it-pushable";
import { targetService } from "../grpc";
import type { MessageContent } from "../types";
import { GatewayBase } from "./base";

export class GatewayClient extends GatewayBase {
    override service: any = targetService();

    // streams
    messagesStream = pushable<any>()

    override postConnect(targetName: string): void {
        this.targetName = targetName;
        const metadata = this.generateMetadata();
        metadata.set("target-name", this.targetName);
        
        this.client.Messages(this.messagesStream, { metadata });
    }

    targetName!: string;

    readonly Client = {
        sendMessage: async (userId: string, content: MessageContent, payload?: any) => {            
            this.messagesStream.push({
                user_id: userId,
                message_content: content,
                payload,
            });
        },

        getUserId: async (externalId: string): Promise<string> => {
            const metadata = this.generateMetadata();
            metadata.delete("project-secret");
            metadata.append("target-name", this.targetName);

            const response = await this.client.Utils(
                {
                    get_user_id: {
                        external_id: externalId,
                    },
                },
                { metadata },
            );

            if (response.success) {
                return response.user_id;
            } else {
                throw new Error(`Failed to get user ID: ${response.error}`);
            }
        },

        getExternalId: async (userId: string): Promise<string> => {
            const response = await this.client.Utils({
                get_external_id: {
                    user_id: userId,
                },
            });

            if (response.success) {
                return response.external_id;
            } else {
                throw new Error(`Failed to get user ID: ${response.error}`);
            }
        },
    };
}
