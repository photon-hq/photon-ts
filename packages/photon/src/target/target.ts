import type { DeployConfig } from "../deploy";
import type { GatewayClient as Gateway } from "../gateway";
import type { MessageContent } from "../types";
import { IDStorage } from "./id-storage";

export interface _Target {
    start(config: DeployConfig): Promise<boolean>;
}

export abstract class Target implements _Target {
    gateway!: Gateway;
    idStorage = new IDStorage();

    async start(config: DeployConfig): Promise<boolean> {
        // Connect to the gateway

        await this.postStart();

        return true;
    }

    async userId(externalID: string, extra?: { phone?: string; email?: string }): Promise<string | null> {
        return this.idStorage.getByExternalId(externalID) ?? this.gateway.Client.getUserId(externalID);
    }

    async externalId(userId: string): Promise<string | null> {
        return this.idStorage.getByUserId(userId) ?? this.gateway.Client.getExternalId(userId);
    }

    async sendMessage(userId: string, message: MessageContent) {
        // TODO: Implement sendMessage
    }

    abstract postStart(): Promise<void>;
}
