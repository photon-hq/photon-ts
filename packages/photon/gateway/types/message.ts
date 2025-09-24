import * as v from "valibot";

export const messageSchema = v.object({
  role: v.picklist(["client", "server"] as const),
  content: v.string(),
  userId: v.string(),
});

export type Message = v.InferOutput<typeof messageSchema>;
