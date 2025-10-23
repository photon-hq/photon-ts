/**
 * Gateway Server - Photon Server SDK for connecting to Gateway
 */

import type { Context } from "../core";
import { serverService } from "../grpc";
import { GatewayBase } from "./base";

export class GatewayServer extends GatewayBase {
    override service: any = serverService();
    
    // streams
    compileStream: any
    
    // outside handlers
    protected compileHandler: ((context: Context) => Promise<Context>) | null = null
    
    override postConnect(): void {
        const metadata = this.generateMetadata()
        this.compileStream = this.client.Compile({ metadata });
        
        (async () => {
            for await (const response of this.compileStream) {
                const context = response.context as Context;
                this.Server.onCompileRequest(response.id, context).catch((error) => {
                    console.error("Error in onCompileRequest:", error);
                });
            }
        })();
    }
    
    readonly Server = {
        registerCompileHandler: (handler: typeof this.compileHandler) => {
            this.compileHandler = handler;
        },
        
        onCompileRequest: async (id: string, context: Context) => {
            const result = await this.compileHandler?.(context);
            if (result) {
                this.Server.sendCompileResult(id, result);
            }
        },
        
        sendCompileResult: async (id: string, context: Context) => {
            await this.compileStream.write({ id, context });
        }
    }
}
