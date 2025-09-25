import { z } from 'zod';

export const messageSchema = z.object({
  role: z.enum(['client', 'server']),
  content: z.string(),
  userId: z.string()
})

export type Message = z.infer<typeof messageSchema>;