import z from "zod";

const AgentScopeSchema = z.object({
    id: z.string(),
    states: z.array(z.string())
})

type AgentScope = z.infer<typeof AgentScopeSchema>;

export type RootAgentScope = AgentScope & { id: "" }