/**
 * Deployable - Elegant deployment of Photon agents
 *
 * Usage:
 * ```typescript
 * const agent = buildAgent((builder) => {
 *     builder.instructions("You are a helpful assistant");
 * });
 *
 * await agent.deploy({
 *     projectId: "my-project",
 *     projectSecret: "secret",
 * });
 * ```
 */

import type { Compiler } from "../core/compiler";
import { Gateway } from "../gateway";

const DEFAULT_GATEWAY_ADDRESS = "gateway.photon.codes:443";

export interface DeployConfigType {
    projectId: string;
    projectSecret: string;
}

export class Deployable {
    private readonly compiler: Compiler;
    private gateway?: Gateway;

    constructor(compiler: Compiler) {
        this.compiler = compiler;
    }

    /**
     * Deploy to Gateway with elegant API
     */
    async deploy(config: DeployConfigType): Promise<void> {
        if (!config.projectId) {
            throw new Error("projectId is required");
        }

        if (!config.projectSecret) {
            throw new Error("projectSecret is required");
        }

        // Get gateway address: env var > default
        const gatewayAddress = process.env.GATEWAY_URL ?? DEFAULT_GATEWAY_ADDRESS;

        // Connect to Gateway
        this.gateway = await Gateway.connect({
            gatewayAddress,
            projectId: config.projectId,
            projectSecret: config.projectSecret,
        });

        // Register compiler
        await this.gateway.Server.register(this.compiler);

        console.log(`[Photon] Deployed successfully`);
        console.log(`[Photon] - Project ID: ${config.projectId}`);
        console.log(`[Photon] - Gateway: ${gatewayAddress}`);
    }

    /**
     * Get Gateway instance
     */
    getGateway(): Gateway | undefined {
        return this.gateway;
    }

    /**
     * Stop and disconnect
     */
    async stop(): Promise<void> {
        if (this.gateway) {
            this.gateway.disconnect();
            this.gateway = undefined;
        }
    }

    /**
     * Get running status
     */
    isDeployed(): boolean {
        return this.gateway?.connected() ?? false;
    }
}
