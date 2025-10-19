import type { AgentDef } from "../deploy/agent-def"
import type { StatesMap } from "./state"

export type Context = {
    scope: string
    user: {
        id: string
        photon: string | null
        email: string | null
    }
    states: StatesMap
    agentDef: AgentDef
}