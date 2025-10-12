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

        send: async (data: OmitDiscriminant<Extract<Message, { role: "user" }>, "role">) => {
            return new Promise<void>((resolve, reject) => {
                this.socket.emit(
                    "message",
                    {
                        role: "user",
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

        registerUser: async (data: RegisterUser) => {
            return new Promise<void>((resolve, reject) => {
                this.socket.emit("registerUser", data, (response: any) => {
                    if (response.success) {
                        resolve();
                    } else {
                        reject(new Error(response.error));
                    }
                });
            });
        },
    };
}

export { GatewayClient };
