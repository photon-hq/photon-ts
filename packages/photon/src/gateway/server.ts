import type { CompiledPhoton, OmitDiscriminant } from "../types";
import { GatewayBase } from "./base.ts";
import type { Message } from "./types";

class GatewayServer extends GatewayBase {
    constructor() {
        super();
    }

    readonly Server = {
        invokableHandler: null as unknown as (key: string, userId: string) => Promise<void> | null,

        send: async (data: OmitDiscriminant<Extract<Message, { role: "server" }>, "role">) => {
            return new Promise<void>((resolve, reject) => {
                const message: Message = {
                    role: "server",
                    ...data,
                };

                const protoMessage = this.serializeMessage(message);
                const streamMessage = { message: protoMessage };

                // Send message through bidirectional stream
                this.stream.write(streamMessage, (error: Error | null | undefined) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        },

        register: async (photon: CompiledPhoton) => {
            return new Promise<void>((resolve, reject) => {
                this.client.Register(
                    {
                        api_key: this.api_key,
                        photon_json: JSON.stringify(photon),
                    },
                    (error: Error | null, response: any) => {
                        if (error) {
                            reject(error);
                        } else if (response.success) {
                            resolve();
                        } else {
                            reject(new Error(response.error || "Registration failed"));
                        }
                    },
                );
            });
        },

        registerInvokableHandler: (handler: (key: string, userId: string) => Promise<void>) => {
            this.Server.invokableHandler = handler;
        },
    };
}

export { GatewayServer as Gateway };
