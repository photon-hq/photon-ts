/**
 * Deployable - Elegant deployment of Photon agents
 */

import type { Context } from "../core";
import type { Compiler } from "../core/compiler";
import { Gateway } from "../gateway";
import type { _Target } from "../target/target";

const DEFAULT_GATEWAY_ADDRESS = "gateway.photon.codes:443";

export interface DeployConfig {
    projectId: string;
    projectSecret: string;
}

export class Deployable {
    private compilers: Record<string, Compiler>;
    private gateway!: Gateway;

    constructor(rootCompiler: Compiler) {
        this.compilers = {
            "": rootCompiler,
        };
    }

    /**
     * Compile method with proper this binding
     * Using arrow function to ensure `this` is preserved
     */
    compile = async (context: Context): Promise<Context> => {
        const compiler = this.compilers[context.scopeName];
        if (!compiler) {
            throw new Error(`Compiler not found for scope '${context.scopeName}'`);
        }
        context.app = this
        return await compiler(context);
    };

    /**
     * Deploy to Gateway with elegant API
     * should not be async
     */
    deploy(...targets: _Target[]): void;
    deploy(config: DeployConfig, ...targets: _Target[]): void;
    deploy(first: DeployConfig | _Target, ...rest: _Target[]): void {
        let config: DeployConfig | null = null;
        let targets: _Target[];

        // Check if first argument is config (has projectId and projectSecret)
        if (typeof first === "object" && "projectId" in first && "projectSecret" in first) {
            // Case: deploy(config, ...targets)
            config = first as DeployConfig;
            targets = rest;
        } else {
            // Case: deploy(...targets) - first is a Target
            targets = [first as _Target, ...rest];
        }

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
        
        const gatewayConfig = {
            gatewayAddress,
            projectId: projectId,
            projectSecret: projectSecret,
        }

        // Connect to Gateway
        this.gateway = Gateway.connect(gatewayConfig);
        
        // set up
        this.gateway.Server.registerCompileHandler(this.compile);

        console.log(`[Photon] Deployed successfully`);
        console.log(`[Photon] - Project ID: ${projectId}`);
        console.log(`[Photon] - Gateway: ${gatewayAddress}`);
        
        // Start Targets
        for (const target of targets) {
            target.start(gatewayConfig);
        }
        
        console.log(`[Photon] - Targets started`);
    }
}
