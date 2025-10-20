import z from "zod";

const AgentConfigSchema = z.object({
    id: z.string(),
    instructions: z.array(z.string())
})

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export type RootAgentConfig = AgentConfig & { id: "" }