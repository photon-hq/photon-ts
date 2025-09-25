import { GatewayBase } from "./base.ts";
import type {Message, RegisterUser} from "./types";

class GatewayEdge extends GatewayBase {
  constructor() {
    super();
  }

  readonly Edge = {
    send: async (data: Omit<Message & {role: "edge"}, "role">) => {
      return new Promise<void>((resolve, reject) => {
        this.socket.emit(
          "message",
          {
            role: "edge",
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

export { GatewayEdge };
