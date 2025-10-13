import { type Message, Target } from "photon";

export class Mock extends Target {
    private readonly userId: string;

    readonly apiKey = `pho_${crypto.randomUUID()}`;

    constructor(userId: string) {
        super()
        this.userId = userId;
    }

    onMessage(data: Message & { role: "assistant" }): void {
        console.log(`[Edge] received assistant message: ${data.type === "plain_text" ? data.content : data.type}`);
    }
    
    async postStart(): Promise<void> {}

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
