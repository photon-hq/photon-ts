import { Target, type MessageContent } from "photon";

export class Mock extends Target {
    override name: string = "Mock";
    
    readonly userExternalId: string = crypto.randomUUID();
    readonly apiKey = `pho_${crypto.randomUUID()}`;

    constructor() {
        super();
    }

    async postStart(): Promise<void> {}

    public override async sendMessage(msg: string) {
        const userId = await this.userId(this.userExternalId)
        
        if (!userId) {
            throw new Error("User ID not found");
        }
        
        super.sendMessage(
            userId,
            {
                type: "plain_text",
                content: msg
            }
        )
    }
    
    protected override onMessage(userId: string, message: MessageContent): void {
        console.log(`Received message from ${userId}: ${message.content}`);
    }
}
