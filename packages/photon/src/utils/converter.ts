import { Struct } from "google-protobuf/google/protobuf/struct_pb";
import type { Context } from "../core/context";
import type { OptionalKey } from "../types";

export function contextToProto(context: OptionalKey<Context, "agentConfig">): Struct {
    return Struct.fromJavaScript(context);
}

/**
 * Convert Proto format to TypeScript Context
 */
export function protoToContext(proto: Struct): Context {
    return proto.toJavaScript() as Context;
}
