import type { CompiledPhoton, OmitDiscriminant } from "../types";
import { GatewayBase } from "./base.ts";
import type { Message } from "./types";
import "./utils.ts"

class GatewayServer extends GatewayBase {
    constructor() {
        super();
    }

    readonly Server = {
        send: async (data: OmitDiscriminant<Extract<Message, { role: "server" }>, "role">) => {
            return this.socket.asyncEmit(
                "message",
                {
                    role: "server",
                    ...data,
                } satisfies Message,
            );
        },

        register: async (photon: CompiledPhoton) => {
            await this.socket.asyncEmit(
                "register",
                {
                    apiKey: this.api_key,
                    photon: photon,
                }
            );
        },
    };
}

export { GatewayServer as Gateway };
