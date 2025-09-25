import {GatewayBase} from "./base.ts";
import type {Message, RegisterUser} from "./types";
import type {OmitDiscriminant} from "../types";

class GatewayClient extends GatewayBase {
    constructor() {
        super();
    }

    readonly Client = {
        send: async (data: OmitDiscriminant<Extract<Message, { role: 'client' }>, 'role'>) => {
            return new Promise<void>((resolve, reject) => {
                this.socket.emit(
                    "message",
                    {
                        role: "client",
                        ...data
                    } satisfies Message,
                    (response: any) => {
                        if (response.success) {
                            resolve();
                        } else {
                            reject(new Error(response.error));
                        }
                    }
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

export {GatewayClient};
