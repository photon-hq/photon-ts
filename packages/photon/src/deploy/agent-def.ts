import z from "zod";

const AgentDefSchema = z.object({
    id: z.string(),
    instructions: z.array(z.string())
})

export type AgentDef = z.infer<typeof AgentDefSchema>;

export type RootAgentDef = AgentDef & { id: "" }