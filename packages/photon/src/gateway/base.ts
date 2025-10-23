/**
 * Gateway Base Class
 */

import * as grpc from "@grpc/grpc-js";
import { type Channel, type Client, type ClientFactory, createChannel, createClientFactory, Metadata } from "nice-grpc";
import type { DeployConfig } from "../deploy";

export type GatewayConfig = DeployConfig & {
    gatewayAddress: string;
};

export abstract class GatewayBase {
    config: GatewayConfig;
    channel: Channel;
    clientFactory: ClientFactory;
    client: any
    
    abstract service: any;

    public constructor(config: GatewayConfig) {
        this.config = config;

        const useSSL =
            !this.config.gatewayAddress.startsWith("localhost") &&
            !this.config.gatewayAddress.startsWith("127.0.0.1") &&
            !this.config.gatewayAddress.startsWith("0.0.0.0");

        const credentials = useSSL ? grpc.credentials.createSsl() : grpc.credentials.createInsecure();

        this.channel = createChannel(config.gatewayAddress, credentials, {
            "grpc.max_receive_message_length": 10 * 1024 * 1024,
            "grpc.max_send_message_length": 10 * 1024 * 1024,
            "grpc.keepalive_time_ms": 30000,
            "grpc.keepalive_timeout_ms": 10000,
            "grpc.keepalive_permit_without_calls": 1,
        });
        
        this.clientFactory = createClientFactory();
    }

    static connect<T extends GatewayBase>(this: new (config: GatewayConfig) => T, config: GatewayConfig, ...args: any[]): T {
        // biome-ignore lint/complexity/noThisInStatic: <We use `this()` to get the proper version of gateway>
        const instance = new this(config);
        instance.client = instance.clientFactory.create(instance.service, instance.channel);
        instance.postConnect(...args);
        return instance;
    }
    
    abstract postConnect(...args: any[]): void
    
    generateMetadata(): Metadata {
        const metadata = new Metadata();
        metadata.set("project-id", this.config.projectId);
        metadata.set("project-secret", this.config.projectSecret);
        return metadata;
    }
}
