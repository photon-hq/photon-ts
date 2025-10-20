import type { AgentConfig } from "../deploy/agent-config"
import type { StatesMap } from "./state"

export type Context = {
    scope_name: string // root's scope name should be empty string
    user: {
        id: string
        photon: string | null
        email: string | null
    }
    states: StatesMap
    agentConfig: AgentConfig
}
