import type { Target } from "../target.ts";
import type { OmitDiscriminant } from "../types";
import { GatewayBase } from "./base.ts";
import type { Message, RegisterUser } from "./types";

class GatewayClient extends GatewayBase {
    constructor() {
        super();
    }

    readonly Client = {
        setTarget: (target: Target) => {
            this.target = target;
        },

        send: async (data: OmitDiscriminant<Extract<Message, { role: "client" }>, "role">) => {
            return new Promise<void>((resolve, reject) => {
                const message: Message = {
                    role: "client",
                    ...data,
                };

                const protoMessage = this.serializeMessage(message);
                const streamMessage = { message: protoMessage };

                this.stream.write(streamMessage, (error: Error | null | undefined) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        },

        registerUser: async (data: RegisterUser) => {
            return new Promise<void>((resolve, reject) => {
                this.client.RegisterUser(
                    {
                        api_key: data.apiKey,
                        user_id: data.userId,
                    },
                    (error: Error | null, response: any) => {
                        if (error) {
                            reject(error);
                        } else if (response.success) {
                            resolve();
                        } else {
                            reject(new Error(response.error || "User registration failed"));
                        }
                    },
                );
            });
        },
    };
}

export { GatewayClient };
