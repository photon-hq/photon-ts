import z from "zod";

export const agentConfigSchema = z.object({
    id: z.string().default(""),
    instructions: z.array(z.string()).default([]),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;
