import type { Merge } from "type-fest";
import type { App } from "../core/app.ts";
import type { ModOut, SomeModifier, SomeUniqueModifier } from "../core/some-modifier.ts";

export interface SomeExtension {
    modifiers: Record<string, (...args: any[]) => SomeModifier<any, any> | SomeUniqueModifier<any, any>>;
}

export type ModifiersOf<T extends SomeExtension> = T extends { modifiers: infer M } ? M : never