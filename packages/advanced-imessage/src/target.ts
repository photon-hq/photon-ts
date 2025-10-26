import { Target, type MessageContent } from "photon";
import { AdvancedIMessageKit, type Message } from "@sg-hq/advanced-imessage-kit";

export interface AdvancedIMessageConfig {
    socketPort?: number;
    enablePrivateAPI?: boolean;
    logLevel?: "debug" | "info" | "warn" | "error";
}

export class AdvancedIMessage extends Target {
    override name: string = "AdvancedIMessage";
    
    private sdk: AdvancedIMessageKit;
    private startTime: Date;

    constructor(config: AdvancedIMessageConfig = {}) {
        super();
        this.sdk = new AdvancedIMessageKit({ 
            socketPort: config.socketPort ?? 1234,
            enablePrivateAPI: config.enablePrivateAPI ?? false,
            logLevel: config.logLevel ?? "info",
            dbPath: ":memory:"
        });
        this.startTime = new Date();
    }

    async postStart(): Promise<void> {
        console.log("[AdvancedIMessage] Starting SDK...");
        
        this.sdk.on("new-message", async (message: Message) => {
            if (message.isFromMe) return;
            
            // Only process messages after startup
            if (message.dateCreated < this.startTime) return;
            
            const text = message.text?.trim();
            if (!text) return;
            
            const sender = message.handle?.id;
            if (!sender) return;
            
            console.log(`[AdvancedIMessage] Received: ${sender}: ${text}`);
            
            const userId = await this.userId(sender);
            if (!userId) return;
            
            console.log(`[AdvancedIMessage] Forwarding to Gateway (userId: ${userId})`);
            await this.gateway.Client.sendMessage(userId, {
                type: "plain_text",
                content: text,
            });
        });
        
        this.sdk.on("error", (error: Error) => {
            console.error("[AdvancedIMessage] SDK error:", error);
        });
        
        await this.sdk.start();
        console.log("[AdvancedIMessage] SDK started");
    }

    protected override async onMessage(userId: string, message: MessageContent): Promise<void> {
        console.log(`[AdvancedIMessage] Received from Gateway (userId: ${userId}):`, message);
        
        const externalId = await this.externalId(userId);
        if (!externalId) {
            console.error("[AdvancedIMessage] External ID not found for userId:", userId);
            return;
        }
        
        if (message.type === "plain_text") {
            console.log(`[AdvancedIMessage] Sending to ${externalId}: ${message.content}`);
            await this.sdk.sendMessage({
                chatGuid: externalId,
                message: message.content,
            });
            console.log(`[AdvancedIMessage] Sent successfully`);
        }
    }

    async close(): Promise<void> {
        await this.sdk.stop();
    }
}
