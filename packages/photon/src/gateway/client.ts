import z from "zod";
import type { Target } from "../target.ts";
import type { OmitDiscriminant } from "../types";
import { GatewayBase } from "./base.ts";
import { type Message, messageSchema, type RegisterUser } from "./types";

class GatewayClient extends GatewayBase {
    constructor() {
        super();
    }

    readonly Client = {
        send: async (data: OmitDiscriminant<Extract<Message, { role: "user" }>, "role">) => {
            return await this.socket.emitWithAck("message", {
                role: "user",
                ...data,
            } satisfies Message);
        },

        registerUser: async (data: Omit<RegisterUser, "apiKey">) => {
            return await this.socket.emitWithAck("registerUser", {
                apiKey: this.api_key,
                ...data,
            } satisfies RegisterUser);
        },

        registerOnMessage: (action: (data: Message & { role: "assistant" }) => void) => {
            this.socket.on("message", (data, callback) => {
                const result = z.safeParse(messageSchema, data);

                if (result.success) {
                    if (result.data.role === "assistant") {
                        action(result.data);
                    }
                    callback({ success: true });
                } else {
                    console.error(result.error);
                }
            });
        },
    };
}

export { GatewayClient };
