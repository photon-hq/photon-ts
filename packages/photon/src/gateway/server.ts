import type { CompiledPhoton, OmitDiscriminant } from "../types";
import { GatewayBase } from "./base.ts";
import type { Message } from "./types";

class GatewayServer extends GatewayBase {
    constructor() {
        super();
    }

    readonly Server = {
        send: async (data: OmitDiscriminant<Extract<Message, { role: "server" }>, "role">) => {
            return new Promise<void>((resolve, reject) => {
                this.socket.emit(
                    "message",
                    {
                        role: "server",
                        ...data,
                    } satisfies Message,
                    (response: any) => {
                        if (response.success) {
                            resolve();
                        } else {
                            reject(new Error(response.error));
                        }
                    },
                );
            });
        },

        register: async (photon: CompiledPhoton) => {
            return new Promise<void>((resolve, reject) => {
                this.socket.emit(
                    "register",
                    {
                        apiKey: this.api_key,
                        photon: photon,
                    },
                    (response: any) => {
                        if (response.success) {
                            resolve();
                        } else {
                            reject(new Error(response.error));
                        }
                    },
                );
            });
        },
    };
}

export { GatewayServer as Gateway };
