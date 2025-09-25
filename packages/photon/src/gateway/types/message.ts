import { z } from "zod";

const messageContentSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("plain_text"),
        content: z.string(),
    }),
    z.object({
        type: z.literal("drafting"),
    }),
]);

export const messageSchema = z
    .discriminatedUnion("role", [
        z.object({
            role: z.literal("client"),
            userId: z.string(),
            payload: z.record(z.string(), z.unknown()),
            keysToPayloadMessage: z.array(z.string()),
        }),
        z.object({
            role: z.literal("server"),
            userId: z.string(),
        }),
    ])
    .and(messageContentSchema);

export type Message = z.infer<typeof messageSchema>;
