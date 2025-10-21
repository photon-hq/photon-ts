import type { MessageContent } from "../types";
import { IDStorage } from "./id-storage";

export interface _Target {
    start(apiKey: string): Promise<boolean>;
}

export abstract class Target implements _Target {
    idStorage = new IDStorage();
    
    async start(apiKey: string): Promise<boolean> {
        // Connect to the gateway

        await this.postStart();

        return true;
    }

    async userId(externalID: string, extra?: { phone?: string, email?: string }): Promise<string> {
        const userId = "" // TODO: Implement userId fetching logic
        
        return userId
    }
    
    async externalId(userId: string): Promise<string> {
        
    }
    
    async sendMessage(userId: string, message: MessageContent) {
        // TODO: Implement sendMessage
    }
    
    abstract postStart(): Promise<void>;
}
