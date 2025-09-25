import { Gateway, type Target } from "photon";

export class Mock implements Target {
  private readonly userId: string;
  private gateway!: Gateway;

  readonly mockKey = `pho_${crypto.randomUUID()}`;

  constructor(userId: string) {
    this.userId = userId;
  }

  async start(): Promise<boolean> {
    this.gateway = await Gateway.connect(this.mockKey);

    console.log(`Mock target started with user: ${this.userId}`);

    await this.gateway.Client.registerUser({
      apiKey: this.mockKey,
      userId: this.userId,
    });

    console.log(`[user:${this.userId}] registered on gateway`);

    return true;
  }

  public async sendMessage(msg: string) {
    await this.gateway.Client.send({
      content: msg,
      userId: this.userId,
      payload: {message: msg},
      keysToPayloadMessage: ['message']
    });

    console.log(`[user:${this.userId}] send message: ${msg}`);
  }
}
