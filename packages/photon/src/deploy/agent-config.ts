import z from "zod";
import { Model } from "../modifiers";

export const agentConfigSchema = z.object({
    model: z.string().default(Model.default),
    instructions: z.array(z.string()).default([]),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;
