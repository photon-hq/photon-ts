import {z} from "zod";

export const flowStepSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal("send"),
        content: z.string()
    }),
    z.object({
        type: z.literal("tell"),
    })
])

export type FlowStep = z.infer<typeof flowStepSchema>;