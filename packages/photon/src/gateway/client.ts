import {GatewayBase} from "./base.ts";
import type {RegisterUser} from "./types";

class GatewayClient extends GatewayBase {
    constructor() {
        super();
    }

    readonly Client = {
        send: async (msg: string, userId: string) => {
            return new Promise<void>((resolve, reject) => {
                this.socket.emit('message', {
                    'role': 'client',
                    'content': msg,
                    'userId': userId
                }, (response: any) => {
                    if (response.success) {
                        resolve();
                    } else {
                        reject(new Error(response.error));
                    }
                })
            })
        },

        registerUser: async (data: RegisterUser) => {
            return new Promise<void>((resolve, reject) => {
                this.socket.emit('registerUser', data, (response: any) => {
                    if (response.success) {
                        resolve();
                    } else {
                        reject(new Error(response.error));
                    }
                })
            })
        }
    }
}

export {GatewayClient};