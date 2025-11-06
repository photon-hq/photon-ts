import type { MessageContent } from "./message-content";

export type UserMessages = {
    role: "user";
    messages: MessageContent[];
};

export type AssistantMessages = {
    role: "assistant";
    messages: MessageContent[];
};

export type History = (UserMessages | AssistantMessages)[];
