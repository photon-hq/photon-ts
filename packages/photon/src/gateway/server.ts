/**
 * Gateway Server - Photon Server SDK for connecting to Gateway
 */

import { pushable } from "it-pushable";
import type { Context } from "../core";
import type { Deployable } from "../deploy";
import { fromStruct, serverService, toStruct } from "../grpc";
import { GatewayBase } from "./base";

export class GatewayServer extends GatewayBase {
    override service: any = serverService();

    // streams
    compileResultStream = pushable<any>({ objectMode: true });
    invokeResultStream = pushable<any>({ objectMode: true });

    // outside handlers
    protected compileHandler: ((context: Context) => Promise<Context>) | null = null;
    protected invokeHandler: typeof Deployable.prototype.invoke | null = null;

    override postConnect(): void {
        const metadata = this.generateMetadata();

        const compileRequests = this.client.Compile(this.compileResultStream, { metadata });

        (async () => {
            for await (const request of compileRequests) {
                const context = fromStruct(request.context) as Context;
                this.Server.onCompileRequest(request.id, context).catch((error) => {
                    console.error("Error in onCompileRequest:", error);
                });
            }
        })();

        const invokeRequests = this.client.Invoke(this.invokeResultStream, { metadata });

        (async () => {
            for await (const request of invokeRequests) {
                const context = fromStruct(request.context) as Context;
                const values = fromStruct(request.values);
                this.Server.onInvokeRequest(request.id, request.name, context, values).catch((error) => {
                    console.error("Error in onInvokeRequest:", error);
                });
            }
        })();
    }

    readonly Server = {
        registerInvokeHandler: (handler: typeof this.invokeHandler) => {
            this.invokeHandler = handler;
        },

        registerCompileHandler: (handler: typeof this.compileHandler) => {
            this.compileHandler = handler;
        },

        onCompileRequest: async (id: string, context: Context) => {
            const result = await this.compileHandler?.(context);
            if (result) {
                this.Server.sendCompileResult(id, result);
            }
        },

        onInvokeRequest: async (id: string, name: string, context: Context, values: any) => {
            const result = await this.invokeHandler?.(name, context, values);
            if (result) {
                this.Server.sendInvokeResult(id, result.context, result.returnValues);
            }
        },

        sendCompileResult: async (id: string, context: Context) => {
            context.app = undefined
            this.compileResultStream.push({
                id,
                context: toStruct(context),
            });
        },

        sendInvokeResult: async (id: string, context: Context, returnValues: any) => {
            context.app = undefined
            this.invokeResultStream.push({
                id,
                context: toStruct(context),
                return_values: toStruct(returnValues),
            });
        },
        
        sendAction: async (name: string, values: any) => {
            return (await this.client.Actions({
                name,
                values: toStruct(values)
            })).return_values ?? null;
        }
    };
}
