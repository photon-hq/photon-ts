import {Gateway, type Target} from "something";

export class Mock implements Target {
    private readonly userId: string;
    private gateway!: Gateway;

    constructor(userId: string) {
        this.userId = userId;
    }

    async start(): Promise<boolean> {
        this.gateway = await Gateway.connect('test')

        console.log(`Mock target started with user: ${this.userId}`)

        return true
    }

    public sendMessage(msg: string) {
        this.gateway.Client.send(msg, this.userId)

        console.log(`[user:${this.userId}] send message: ${msg}`)
    }
}