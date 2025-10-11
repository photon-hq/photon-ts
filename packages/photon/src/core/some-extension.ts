import type { ZodObject } from "zod";
import type { SomeAction } from "./some-action.ts";
import type { AnyModifier } from "./some-modifier.ts";

export interface SomeExtension {
    modifiers: Record<string, (...args: any[]) => AnyModifier<any, any>>;
    actions: Record<string, (...args: any[]) => SomeAction<any>>;
    photonType?: ZodObject<any>;
}

export type ActionsOf<T extends SomeExtension> = T extends { actions: infer A } ? A : never;
