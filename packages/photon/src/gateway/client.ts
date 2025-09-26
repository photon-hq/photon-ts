import { GatewayBase } from "./base.ts";
import type { Message, RegisterUser } from "./types/index.ts";
import type { Target } from "./types/target.ts";

class GatewayClient extends GatewayBase {
    constructor() {
        super();
    }

    readonly Client = {
        setTarget: (target: Target) => {
            this.target = target;
        },

        send: async (data: Omit<Extract<Message, { role: "client" }>, "role">) => {
            return new Promise<void>((resolve, reject) => {
                this.socket.emit(
                    "message",
                    {
                        role: "client",
                        ...data,
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

        registerUser: async (data: Omit<RegisterUser, "apiKey">) => {
            return new Promise<void>((resolve, reject) => {
                this.socket.emit(
                    "registerUser",
                    { apiKey: this.apiKey, ...data },
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

export { GatewayClient };
