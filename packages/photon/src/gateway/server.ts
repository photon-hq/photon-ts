/**
 * Gateway Server - Photon Server SDK for connecting to Gateway
 */

import type { Context } from "../core";
import { serverService, toStruct, fromStruct } from "../grpc";
import { GatewayBase } from "./base";
import { pushable } from "it-pushable";

export class GatewayServer extends GatewayBase {
    override service: any = serverService();
    
    // streams
    compileResultStream = pushable<any>({ objectMode: true })
    
    // outside handlers
    protected compileHandler: ((context: Context) => Promise<Context>) | null = null
    
    override postConnect(): void {
        const metadata = this.generateMetadata()
        
        async function* compileResultsInterator() {
            
        }
        
        const compileRequests = this.client.Compile(this.compileResultStream, { metadata });
        
        (async () => {
            for await (const response of compileRequests) {
                const context = fromStruct(response.context) as Context;
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
            this.compileResultStream.push({ 
                id, 
                context: toStruct(context) 
            });
        }
    }
}
