import {GatewayBase} from "./base.ts";
import type {CompiledPhoton} from "../types";

class GatewayServer extends GatewayBase {
    constructor() {
        super();
    }

    readonly Server = {
        send: async (msg: string, userId: string) => {

        },

        register: async (photon: CompiledPhoton) => {
            return new Promise<void>((resolve, reject) => {
                this.socket.emit('register', {
                    'apiKey': this.api_key,
                    'photon': photon
                }, (response: any) => {
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

export {GatewayServer as Gateway};