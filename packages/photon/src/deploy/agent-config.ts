import z from "zod";

export const agentConfigSchema = z.object({
    instructions: z.array(z.string()).default([]),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;
