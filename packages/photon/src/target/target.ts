import { GatewayClient as Gateway, type GatewayConfig } from "../gateway";
import type { MessageContent } from "../types";
import { IDStorage } from "./id-storage";

export interface _Target {
    start(config: GatewayConfig): boolean;
}

export abstract class Target implements _Target {
    abstract name: string;
    
    gateway!: Gateway;
    idStorage = new IDStorage();

    start(config: GatewayConfig): boolean {
        this.gateway = Gateway.connect(config, this.name);
        
        // register

        this.postStart();

        return true;
    }

    async userId(externalID: string, extra?: { phone?: string; email?: string }): Promise<string | null> {
        return this.idStorage.getByExternalId(`${this.name}://${externalID}`) ?? await this.gateway.Client.getUserId(externalID);
    }

    async externalId(userId: string): Promise<string | null> {
        const rawExternalId: string | null = this.idStorage.getByUserId(userId) ?? await this.gateway.Client.getExternalId(userId);
        
        if (!rawExternalId) return null;
        
        return rawExternalId.split("://")[1] ?? null
    }

    async sendMessage(userId: string, message: MessageContent, payload?: any) {
        await this.gateway.Client.sendMessage(userId, message, payload);
    }

    abstract postStart(): Promise<void>;
}
