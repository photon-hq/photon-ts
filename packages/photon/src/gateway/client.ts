/**
 * Gateway Client - Target SDK for connecting to Gateway
 */

import { targetService } from "../grpc";
import type { MessageContent } from "../types";
import { GatewayBase } from "./base";

export class GatewayClient extends GatewayBase {
    override service: any = targetService();

    // streams
    messagesStream: any;

    override postConnect(): void {
        const metadata = this.generateMetadata();
        metadata.append("target-name", this.targetName);
        this.messagesStream = this.client.Messages({ metadata });
    }

    targetName!: string;

    readonly Client = {
        registerTargetName: (name: string) => {
            this.targetName = name;
        },

        sendMessage: async (userId: string, content: MessageContent, payload: any) => {
            await this.messagesStream.write({
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
                get_user_id: {
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
