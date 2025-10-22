import type { DeployConfigType } from "../deploy";
import type { MessageContent } from "../types";
import { IDStorage } from "./id-storage";
import { GatewayClient as Gateway } from "../gateway";

export interface _Target {
    start(config: DeployConfigType): Promise<boolean>;
}

export abstract class Target implements _Target {
    gateway!: Gateway
    idStorage = new IDStorage();

    async start(config: DeployConfigType): Promise<boolean> {
        // Connect to the gateway

        await this.postStart();

        return true;
    }

    async userId(externalID: string, extra?: { phone?: string; email?: string }): Promise<string | null> {
        return this.idStorage.getByExternalId(externalID) ?? null;
    }

    async externalId(userId: string): Promise<string | null> {
        return this.idStorage.getByUserId(userId) ?? null;
    }

    async sendMessage(userId: string, message: MessageContent) {
        // TODO: Implement sendMessage
    }

    abstract postStart(): Promise<void>;
}
