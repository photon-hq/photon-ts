import { contextToProto, protoToContext } from "../context/converter";
import type { Compiler } from "../core/compiler";
import type { Context } from "../core/context";
import { ServerService } from "../grpc/server";
import type { _Target } from "./target";

export interface DeployConfigType {
    // Gateway config
    // Note: Environment variable reading (process.env.GATEWAY_URL) is for testing only, not exposed to end users
    // Default: "gateway.photon.codes"
    gatewayAddress?: string;
    projectId: string;
    projectSecret: string;
}

export class Deployable {
    private readonly compiler: Compiler;
    private serverService?: ServerService;

    constructor(compiler: Compiler) {
        this.compiler = compiler;
    }

    /**
     * Compile context using the compiler
     * The compiler handles recompilation loops and agentConfig
     */
    private async compileContext(context: Context, _projectId?: string): Promise<Context> {
        return await this.compiler(context);
    }

    /**
     * Deploy Server to Gateway
     *
     * Connects to Gateway via bidirectional stream
     */
    async deploy(config: DeployConfigType): Promise<void> {
        if (!config.projectId) {
            throw new Error("projectId is required");
        }

        if (!config.projectSecret) {
            throw new Error("projectSecret is required");
        }

        // Default gatewayAddress
        // Note: Environment variable reading (process.env.GATEWAY_URL) is for testing only, not exposed to users
        const gatewayAddress = config.gatewayAddress ?? process.env.GATEWAY_URL ?? "gateway.photon.codes";

        // Create Server Service
        this.serverService = new ServerService({
            gatewayAddress,
            projectId: config.projectId,
            projectSecret: config.projectSecret,
            compileContext: async (request) => {
                try {
                    // Convert proto format to TypeScript Context
                    const context = protoToContext(request.context);

                    // Compile using builder
                    const compiledContext = await this.compileContext(context, request.project_id);

                    // Convert back to proto format
                    return {
                        request_id: request.request_id,
                        success: true,
                        context: contextToProto(compiledContext),
                    };
                } catch (error) {
                    return {
                        request_id: request.request_id,
                        success: false,
                        error: (error as Error).message,
                    };
                }
            },
        });

        // Start service (connects to Gateway)
        await this.serverService.start();

        console.log(`[Photon] Deployed successfully`);
        console.log(`[Photon] - Project ID: ${config.projectId}`);
        console.log(`[Photon] - Gateway: ${gatewayAddress}`);
    }

    /**
     * Get Server Service (for sending messages, etc.)
     */
    getService(): ServerService | undefined {
        return this.serverService;
    }

    /**
     * Stop Server Service
     */
    async stop(): Promise<void> {
        if (this.serverService) {
            await this.serverService.stop();
        }
    }
}
