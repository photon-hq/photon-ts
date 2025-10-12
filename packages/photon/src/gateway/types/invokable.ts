import z from "zod";

export const invokableSchema = z.object({
    userId: z.uuid(),
    key: z.string(),
    additionalData: z.looseObject({})
})

export type Invokable = z.infer<typeof invokableSchema>;