import type { Context } from "../core/context";
import { agentConfigSchema } from "../deploy/agent-config";
import type { ProtoContextType } from "../grpc";

export function contextToProto(context: Omit<Context, "agentConfig">): ProtoContextType {
    const protoStates: Record<string, { json_data: string }> = {};

    // Convert states: Record<string, Record<string, any>> -> map<string, States>
    if (context.states && typeof context.states === "object") {
        for (const [scope, stateObj] of Object.entries(context.states)) {
            if (stateObj === null || stateObj === undefined) {
                // Skip null/undefined states
                continue;
            }

            try {
                protoStates[scope] = {
                    json_data: JSON.stringify(stateObj),
                };
            } catch (error) {
                throw new Error(
                    `Failed to serialize states for scope "${scope}": ${(error as Error).message}`,
                );
            }
        }
    }

    return {
        scope_name: context.scopeName,
        user: {
            id: context.user.id,
            photon: context.user.photon ?? undefined,
            email: context.user.email ?? undefined,
        },
        states: protoStates
    };
}

/**
 * Convert Proto format to TypeScript Context
 */
export function protoToContext(proto: ProtoContextType): Context {
    const states: Record<string, Record<string, any>> = {};

    // Convert map<string, States> -> Record<string, Record<string, any>>
    if (proto.states && typeof proto.states === "object") {
        for (const [scope, stateMsg] of Object.entries(proto.states)) {
            if (!stateMsg || !stateMsg.json_data) {
                // Skip invalid state entries
                continue;
            }

            try {
                const parsed = JSON.parse(stateMsg.json_data);
                // Ensure parsed result is an object
                if (parsed !== null && typeof parsed === "object") {
                    states[scope] = parsed;
                }
            } catch (error) {
                throw new Error(
                    `Failed to deserialize states for scope "${scope}": ${(error as Error).message}`,
                );
            }
        }
    }

    return {
        scopeName: proto.scope_name,
        user: {
            id: proto.user.id,
            photon: proto.user.photon ?? null,
            email: proto.user.email ?? null,
        },
        states,
        agentConfig: agentConfigSchema.parse(proto.agent_config)
    };
}
