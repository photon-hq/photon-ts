import { GatewayClient } from "./gateway/client";
import type { Message } from "./gateway/types";

export interface _Target {
    start(apiKey: string): Promise<boolean>;
}

export abstract class Target implements _Target {
    protected gateway!: GatewayClient;

    async start(apiKey: string): Promise<boolean> {
        this.gateway = await GatewayClient.connect(apiKey);
        
        this.gateway.Client.registerOnMessage(this.onMessage.bind(this))
        
        await this.postStart();
        
        return true;
    }

    async registerUser(userId: string): Promise<void> {
        return await this.gateway.Client.registerUser({
            userId,
        });
    }
    
    abstract onMessage(data: Message & { role: "assistant" }): void
    abstract postStart(): Promise<void>;
}
