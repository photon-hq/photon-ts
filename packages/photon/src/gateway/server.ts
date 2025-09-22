import {GatewayBase} from "./base.ts";
import type {CompiledPhoton} from "../types/compiled-photon.ts";

class GatewayServer extends GatewayBase {
    constructor() {
        super();
    }

    readonly Server = {
        send: async (msg: string, userId: string) => {

        },

        register: async (photon: CompiledPhoton) => {

        }
    }
}

export {GatewayServer as Gateway};