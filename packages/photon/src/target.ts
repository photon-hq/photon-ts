import type {Message} from "./gateway/types";

export interface Target {
    start(): Promise<boolean>;
    onMessage(data: Message & { role: "server"}): void
}
