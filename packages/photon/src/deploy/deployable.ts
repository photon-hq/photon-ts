/**
 * Deployable - Elegant deployment of Photon agents
 *
 */

import type { Context } from "../core";
import type { Compiler } from "../core/compiler";
import { Gateway } from "../gateway";
import type { _Target } from "../target/target";

const DEFAULT_GATEWAY_ADDRESS = "gateway.photon.codes:443";

export interface DeployConfigType {
    projectId: string;
    projectSecret: string;
}

export class Deployable {
    private compilers: Record<string, Compiler>;
    private gateway?: Gateway;

    constructor(rootCompiler: Compiler) {
        this.compilers = {
            "": rootCompiler,
        };
    }

    async compile(context: Context): Promise<Context> {
        const compiler = this.compilers[context.scopeName];
        if (!compiler) {
            throw new Error(`Compiler not found for scope '${context.scopeName}'`);
        }
        return await compiler(context);
    }

    /**
     * Deploy to Gateway with elegant API
     */
    async deploy(config?: DeployConfigType, ...targets: _Target[]): Promise<void> {
        const projectId = config?.projectId ?? process.env.PROJECT_ID;
        const projectSecret = config?.projectSecret ?? process.env.PROJECT_SECRET;

        if (!projectId) {
            throw new Error("Project ID is required");
        }

        if (!projectSecret) {
            throw new Error("Project Secret is required");
        }

        // Get gateway address: env var > default
        const gatewayAddress = process.env.GATEWAY_URL ?? DEFAULT_GATEWAY_ADDRESS;

        // Connect to Gateway
        this.gateway = await Gateway.connect({
            gatewayAddress,
            projectId: projectId,
            projectSecret: projectSecret,
        });

        // Register compiler
        await this.gateway.Server.register();
        this.gateway.Server.registerCompiler(this.compile);

        console.log(`[Photon] Deployed successfully`);
        console.log(`[Photon] - Project ID: ${projectId}`);
        console.log(`[Photon] - Gateway: ${gatewayAddress}`);
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
