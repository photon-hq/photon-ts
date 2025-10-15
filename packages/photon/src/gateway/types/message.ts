import { z } from "zod";

export const messageContentSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("plain_text"),
        content: z.string(),
    }),
]);

export const assistantMessageSchema = z
    .object({
        role: z.literal("assistant"),
        userId: z.string(),
    })
    .and(messageContentSchema);

export const userMessageSchema = z
    .object({
        role: z.literal("user"),
        userId: z.string(),
        payload: z.record(z.string(), z.unknown()),
        keysToPayloadMessage: z.array(z.string()),
    })
    .and(messageContentSchema);


export type AssistantMessage = z.infer<typeof assistantMessageSchema>;
export type UserMessage = z.infer<typeof userMessageSchema>;
export type MessageContent = z.infer<typeof messageContentSchema>;
