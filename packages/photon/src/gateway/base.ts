import { io, Socket } from "socket.io-client";
import { type Message, messageSchema } from "./types/index.ts";
import type { Target } from "./types/target.ts";

export class GatewayBase {
    protected socket!: Socket;
    protected apiKey!: string;
    protected target: Target | null = null;

    protected constructor() {}

    static async connect<T extends GatewayBase>(this: new () => T, apiKey: string): Promise<T> {
        const gateway = new this();

        gateway.apiKey = apiKey;

        await new Promise<void>((resolve, reject) => {
            gateway.socket = io(process.env.PHOTON_GATEWAY_URL || "http://localhost:4001", {
                transports: ["websocket"],
                auth: { token: apiKey },
            });

            gateway.socket.on("connect", () => {
                console.log("Connected:", gateway.socket.id);
                resolve();
            });

            gateway.socket.on("connect_error", (err) => {
                console.error("Connect error:", err.message);
                reject(err);
            });

            gateway.socket.on("disconnect", () => {
                console.log("Disconnected:", gateway.socket.id);
            });

            gateway.socket.on("message", (data, callback) => {
                const result = messageSchema.safeParse(data);

                if (result.success) {
                    gateway.onMessage(result.data);

                    callback?.({ success: true });
                } else {
                    console.error(result.error);
                    callback?.({ success: false, error: result.error.issues });
                }
            });
        });

        return gateway as T;
    }

    public onMessage(handler: (data: Message) => void): void;
    public onMessage(data: Message): void;
    public onMessage(arg: ((data: Message) => void) | Message) {
        if (typeof arg === "function") {
            const handler = arg;
            (this as any)._onMessageHandler = handler;
            return;
        }

        const data = arg;
        if (data.role === "server" && this.target) {
            this.target.onMessage(data);
        }
        const handler = (this as any)._onMessageHandler as ((d: Message) => void) | undefined;
        handler?.(data);
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}
