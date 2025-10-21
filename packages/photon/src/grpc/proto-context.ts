/**
 * Context Types
 */

import type { AgentConfig } from "../deploy";

/**
 * Proto Context format (matches photon-service.proto)
 */
export interface ProtoContextType {
    scope_name: string;
    user: {
        id: string;
        photon?: string;
        email?: string;
    };
    states: Record<string, { json_data: string }>;
    agent_config?: AgentConfig
}
