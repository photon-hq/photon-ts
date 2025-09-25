import { z } from 'zod';

export const messageSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal("edge"),
    message: z.string(),
    userId: z.string(),
    payload: z.record(z.string(), z.unknown()),
    keysToPayloadMessage: z.array(z.string())
  }),
  z.object({
    role: z.literal("server"),
    message: z.string(),
    userId: z.string()
  })
])
export type Message = z.infer<typeof messageSchema>;