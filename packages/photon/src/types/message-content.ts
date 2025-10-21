import z from "zod";

export const messageContentSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("plain_text"),
        content: z.string()
    })
])
