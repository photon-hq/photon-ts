import z from "zod";

export const identitySchema = z.object({
    userId: z.uuid(),
    externalUserId: z.uuid()
});

export type Identity = z.infer<typeof identitySchema>;