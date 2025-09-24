import * as v from "valibot";

export const registerUserSchema = v.object({
  apiKey: v.string(),
  userId: v.string(),
});

export type RegisterUser = v.InferOutput<typeof registerUserSchema>;
