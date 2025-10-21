/**
 * Context Types
 */

/**
 * Proto Context format (matches photon-service.proto)
 */
export interface ProtoContextType {
    scope: string;
    user: {
        id: string;
        photon?: string;
        email?: string;
    };
    states: Record<string, { json_data: string }>;
    agent_config?: {
        id: string;
        instructions: string[];
    };
}
