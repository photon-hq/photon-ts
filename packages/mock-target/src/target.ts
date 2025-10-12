import { Gateway, type Message, type Target } from "photon";

export class Mock implements Target {
    private readonly userId: string;
    private gateway!: Gateway;

    readonly apiKey = `pho_${crypto.randomUUID()}`;

    constructor(userId: string) {
        this.userId = userId;
    }

    async start(): Promise<boolean> {
        this.gateway = await Gateway.connect(this.apiKey);
        this.gateway.Client.setTarget(this);

        console.log(`Mock target started with user: ${this.userId}`);

        await this.gateway.Client.registerUser({
            apiKey: this.apiKey,
            userId: this.userId,
        });

        console.log(`[user:${this.userId}] registered on gateway`);

        return true;
    }

    onMessage(data: Message & { role: "assistant" }): void {
        console.log(`[Edge] received assistant message: ${data.type === "plain_text" ? data.content : data.type}`);
    }

    public async sendMessage(msg: string) {
        await this.gateway.Client.send({
            type: "plain_text",
            content: msg,
            userId: this.userId,
            payload: { message: msg },
            keysToPayloadMessage: ["message"],
        });
    }
}
