import { io, type Socket } from "socket.io-client";
import { z } from "zod";
import type { Target } from "../target.ts";
import { type Message, messageSchema } from "./types";

export class GatewayBase {
    protected socket!: Socket;
    protected api_key!: string;
    protected target: Target | null = null;

    protected constructor() {}

    static async connect<T extends GatewayBase>(this: new () => T, api_key: string): Promise<T> {
        // biome-ignore lint/complexity/noThisInStatic: <We use `this()` to get the proper version of gateway>
        const gateway = new this();

        gateway.api_key = api_key;

        await new Promise<void>((resolve) => {
            gateway.socket = io("http://localhost:4001", {
                transports: ["websocket"],
            });

            gateway.socket.on("connect", () => {
                console.log("Connected:", gateway.socket.id);
                resolve();
            });

            gateway.socket.on("disconnect", () => {
                console.log("Disconnected:", gateway.socket.id);
            });

            gateway.socket.on("message", (data, callback) => {
                const result = z.safeParse(messageSchema, data);

                if (result.success) {
                    gateway.onMessage(result.data);

                    callback({
                        success: true,
                    });
                } else {
                    console.error(result.error);
                }
            });
        });

        return gateway as T;
    }

    private async onMessage(data: Message) {
        if (data.role === "server") {
            if (this.target) {
                this.target.onMessage(data);
            }
        }
    }
}
