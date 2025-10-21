/**
 * Context Converter
 */

import type { Context } from "../core/context";
import type { ProtoContextType } from "../types/context";

/**
 * Convert TypeScript Context to Proto format
 */
export function contextToProto(context: Context): ProtoContextType {
    if (!context) {
        throw new Error("Context is required");
    }

    if (!context.scope_name && context.scope_name !== "") {
        throw new Error("Context.scope_name is required");
    }

    if (!context.user || !context.user.id) {
        throw new Error("Context.user.id is required");
    }

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
                throw new Error(`Failed to serialize states for scope "${scope}": ${(error as Error).message}`);
            }
        }
    }

    return {
        scope: context.scope_name,
        user: {
            id: context.user.id,
            photon: context.user.photon ?? undefined,
            email: context.user.email ?? undefined,
        },
        states: protoStates,
        agent_config: context.agentConfig
            ? {
                  id: context.agentConfig.id || "",
                  instructions: Array.isArray(context.agentConfig.instructions) ? context.agentConfig.instructions : [],
              }
            : {
                  id: "",
                  instructions: [],
              },
    };
}

/**
 * Convert Proto format to TypeScript Context
 */
export function protoToContext(proto: ProtoContextType): Context {
    if (!proto) {
        throw new Error("Proto context is required");
    }

    if (!proto.scope) {
        throw new Error("Proto context.scope is required");
    }

    if (!proto.user || !proto.user.id) {
        throw new Error("Proto context.user.id is required");
    }

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
                throw new Error(`Failed to deserialize states for scope "${scope}": ${(error as Error).message}`);
            }
        }
    }

    return {
        scope_name: proto.scope,
        user: {
            id: proto.user.id,
            photon: proto.user.photon ?? null,
            email: proto.user.email ?? null,
        },
        states,
        agentConfig: {
            id: proto.agent_config?.id || "",
            instructions: Array.isArray(proto.agent_config?.instructions) ? proto.agent_config.instructions : [],
        },
    };
}
