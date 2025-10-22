import type { Context } from "../core/context";
import type { OptionalKey } from "../types";

export function contextToProto(context: OptionalKey<Context, "agentConfig">): Record<string, any> {
    return context
}

/**
 * Convert Proto format to TypeScript Context
 */
export function protoToContext(proto: Record<string, any>): Context {
    return proto as Context;
}
