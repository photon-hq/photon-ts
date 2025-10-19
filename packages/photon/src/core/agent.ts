import type { Promisable } from "type-fest";
import type { Context } from "./context";
import type { HandoffOptions } from "./handoff-options";
import type { Deployable } from "../deploy";

type Builder = (context: Context) => Promisable<void>;

export function $(builder: Builder): Agent & Deployable;
export function $(name: string, builder: Builder, options?: HandoffOptions): Agent;
export function $(
    nameOrBuilder: string | Builder,
    builder?: Builder,
    options?: HandoffOptions
): any {
    
    
}

class Agent {
    
}