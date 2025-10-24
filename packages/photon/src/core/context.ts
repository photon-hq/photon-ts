import type { Deployable } from "../deploy";
import type { AgentConfig } from "../deploy/agent-config";
import type { StatesMap } from "./state";

export type Context = {
    scopeName: string; // root's scope name should be empty string
    user: {
        id: string;
        phone: string | null;
        email: string | null;
    };
    states: StatesMap;
    agentConfig: AgentConfig;
    app: Deployable | null | undefined
};