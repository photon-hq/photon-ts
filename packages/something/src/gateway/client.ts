import {GatewayBase} from "./base.ts";

class GatewayClient extends GatewayBase {
    constructor() {
        super();
    }

    readonly Client = {
        send: async (msg: string, userId: string) => {
            this.socket.emit('message', {
                'role': 'client',
                'content': msg,
                'userId': userId
            })
        }
    }
}

export {GatewayClient};