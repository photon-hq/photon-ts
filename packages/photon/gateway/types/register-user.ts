import { z } from 'zod';

export const registerUserSchema = z.object({
  apiKey: z.string(),
  userId: z.string()
})

export type RegisterUser = z.infer<typeof registerUserSchema>;