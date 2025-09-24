import { io, Socket } from "socket.io-client";
import * as v from "valibot";
import { type Message, messageSchema } from "./types/message.ts";

export class GatewayBase {
  protected socket!: Socket;
  protected api_key!: string;

  protected constructor() {}

  static async connect<T extends GatewayBase>(
    this: new () => T,
    api_key: string
  ): Promise<T> {
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

      gateway.socket.on("message", (data) => {
        const result = v.safeParse(messageSchema, data);

        if (result.success) {
          gateway.onMessage(result.output);
        } else {
          console.error(result.issues);
        }
      });
    });

    return gateway as T;
  }

  private async onMessage(data: Message) {}
}
