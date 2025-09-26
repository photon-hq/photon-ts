import type { Message } from "./message";

export interface Target {
    start(): Promise<boolean>;
    onMessage(data: Message & { role: "server" }): void;
}
