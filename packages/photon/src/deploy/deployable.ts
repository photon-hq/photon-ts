import { contextToProto, protoToContext } from "../context/converter";
import type { Compiler } from "../core/compiler";
import type { Context } from "../core/context";
import { SDKService } from "../grpc/sdk-service";
import type { _Target } from "./target";

export interface DeployConfigType {
    // Server config
    port?: number;
    host?: string;

    // Gateway config
    gatewayAddress: string;
    projectId: string;
    token: string;

    // SDK public address for registration (if different from host:port)
    // Required if host is 0.0.0.0 or behind NAT/firewall
    // Example: 'sdk.example.com:50051' or '203.0.113.1:50051'
    publicAddress?: string;
}

export class Deployable {
    private readonly compiler: Compiler;
    private sdkService?: SDKService;

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
     * Deploy SDK to Gateway
     *
     * Starts gRPC server and registers with Gateway
     */
    async deploy(config: DeployConfigType): Promise<void> {
        if (!config.projectId) {
            throw new Error("projectId is required");
        }

        if (!config.token) {
            throw new Error("token is required");
        }

        if (!config.gatewayAddress) {
            throw new Error("gatewayAddress is required");
        }

        // Create SDK Service
        this.sdkService = new SDKService({
            port: config.port ?? 50051,
            host: config.host,
            gatewayAddress: config.gatewayAddress,
            projectId: config.projectId,
            token: config.token,
            publicAddress: config.publicAddress,
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

        // Start service
        await this.sdkService.start();

        console.log(`[Photon] Deployed successfully`);
        console.log(`[Photon] - Project ID: ${config.projectId}`);
        console.log(`[Photon] - Gateway: ${config.gatewayAddress}`);
        console.log(`[Photon] - Listening: ${config.host ?? "0.0.0.0"}:${config.port ?? 50051}`);
    }

    /**
     * Get SDK Service instance (for sending messages, etc.)
     */
    getService(): SDKService | undefined {
        return this.sdkService;
    }

    /**
     * Stop SDK Service
     */
    async stop(): Promise<void> {
        if (this.sdkService) {
            await this.sdkService.stop();
        }
    }
}
