import z from "zod";
import { Model } from "../modifiers";
import { hookTypeSchema } from "../modifiers/hook";

export const agentConfigSchema = z.object({
    model: z.string().default(Model.default),
    instructions: z.array(z.string()).default([]),
    hooks: z.union([
        z.set(hookTypeSchema),
        z.array(hookTypeSchema).transform((value) => new Set(value))
    ]).default(new Set()),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;
