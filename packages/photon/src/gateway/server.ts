import type { any } from "zod/v3";
import type { App } from "../core/app.ts";
import type { CompiledPhoton, OmitDiscriminant } from "../types";
import { GatewayBase } from "./base.ts";
import type { Invokable, Message } from "./types";

class GatewayServer extends GatewayBase {
    constructor() {
        super();
    }

    readonly Server = {
        send: async (data: OmitDiscriminant<Extract<Message, { role: "assistant" }>, "role">) => {
            return this.socket.emitWithAck("message", {
                role: "assistant",
                ...data,
            } satisfies Message);
        },

        register: async (photon: CompiledPhoton) => {
            await this.socket.emitWithAck("register", {
                apiKey: this.api_key,
                photon: photon,
            });
        },

        registerInvokableHandler: (handler: (invocation: Invokable) => Promise<any>) => {
            this.socket.on("invoke", async (data: Invokable, callback) => {
                const result = await handler(data);
                callback({ success: true, result });
            });
        },
    };
}

export { GatewayServer as Gateway };
