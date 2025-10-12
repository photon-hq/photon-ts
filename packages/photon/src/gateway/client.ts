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
            return await this.socket.emitWithAck("message", {
                role: "user",
                ...data
            } satisfies Message)
        },

        registerUser: async (data: RegisterUser) => {
            return await this.socket.emitWithAck("registerUser", data)
        },
    };
}

export { GatewayClient };
