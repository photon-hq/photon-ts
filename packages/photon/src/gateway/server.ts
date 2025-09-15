import {GatewayBase} from "./base.ts";

class GatewayServer extends GatewayBase {
    constructor() {
        super();
    }

    readonly Server = {
        send: async (msg: string, userId: string) => {

        }
    }
}

export {GatewayServer as Gateway};