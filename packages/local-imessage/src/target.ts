import { Target, type MessageContent } from "photon";
import { IMessageSDK, type IMessage } from "@photon-ai/imessage-kit";

type Message = IMessage.Message;

export class LocalIMessage extends Target {
    override name: string = "LocalIMessage";
    
    private sdk: IMessageSDK;
    private startTime: Date;

    constructor() {
        super();
        this.sdk = new IMessageSDK({ debug: true });
        this.startTime = new Date();
    }

    async postStart(): Promise<void> {
        console.log("[LocalIMessage] Starting watcher...");
        await this.sdk.startWatching({
            onNewMessage: async (message: Message) => {
                if (message.isFromMe) return;
                
                // Only process messages after startup
                if (message.date < this.startTime) return;
                
                const text = message.text?.trim();
                if (!text) return;
                
                console.log(`[LocalIMessage] Received: ${message.sender}: ${text}`);
                
                const userId = await this.userId(message.sender);
                if (!userId) return;
                
                console.log(`[LocalIMessage] Forwarding to Gateway (userId: ${userId})`);
                await this.gateway.Client.sendMessage(userId, {
                    type: "plain_text",
                    content: text,
                });
            },
            onError: (error) => {
                console.error("[LocalIMessage] iMessage error:", error);
            }
        });
        console.log("[LocalIMessage] Watcher started");
    }

    protected override async onMessage(userId: string, message: MessageContent): Promise<void> {
        console.log(`[LocalIMessage] Received from Gateway (userId: ${userId}):`, message);
        
        const externalId = await this.externalId(userId);
        if (!externalId) {
            console.error("[LocalIMessage] External ID not found for userId:", userId);
            return;
        }
        
        if (message.type === "plain_text") {
            console.log(`[LocalIMessage] Sending to ${externalId}: ${message.content}`);
            await this.sdk.send(externalId, message.content);
            console.log(`[LocalIMessage] Sent successfully`);
        }
    }

    async close() {
        await this.sdk.close();
    }
}

