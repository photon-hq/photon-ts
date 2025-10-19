import type { Promisable } from "type-fest";
import type { Context } from "./context";
import type { HandoffOptions } from "./handoff-options";
import type { Deployable } from "../deploy";

export type Builder = (context: Context) => Promisable<void>;

export function $(builder: Builder): Deployable;
export function $(name: string, builder: Builder, options?: HandoffOptions): void;
export function $(
    nameOrBuilder: string | Builder,
    builder?: Builder,
    options?: HandoffOptions
): any {
    
    
}