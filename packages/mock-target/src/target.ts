import {Gateway, type Target} from "photon";

export class Mock implements Target {
    private readonly userId: string;
    private gateway!: Gateway;
    readonly mockKey = `pho_${crypto.randomUUID()}`;

    constructor(userId: string) {
        this.userId = userId;
    }

    async start(): Promise<boolean> {
        this.gateway = await Gateway.connect(this.mockKey)

        console.log(`Mock target started with user: ${this.userId}`)

        return true
    }

    public sendMessage(msg: string) {
        this.gateway.Client.send(msg, this.userId)

        console.log(`[user:${this.userId}] send message: ${msg}`)
    }
}