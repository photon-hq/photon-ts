import { GatewayBase } from "./base.ts";
import type { CompiledPhoton } from "../types";
import type { Message } from "./types/index.ts";

class GatewayServer extends GatewayBase {
    constructor() {
        super();
    }

    readonly Server = {
        send: async (data: Omit<Extract<Message, { role: "server" }>, "role">) => {
            return new Promise<void>((resolve, reject) => {
                this.socket.emit(
                    "message",
                    {
                        role: "server",
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

        register: async (photon: CompiledPhoton) => {
            return new Promise<void>((resolve, reject) => {
                this.socket.emit(
                    "register",
                    {
                        apiKey: this.apiKey,
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

    public async register(photon: CompiledPhoton): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket.emit("register", { apiKey: this.apiKey, photon }, (response: any) => {
                if (response?.success) {
                    resolve();
                } else {
                    reject(new Error(response?.error || "Failed to register application"));
                }
            });
        });
    }
}

export { GatewayServer, GatewayServer as Gateway };
