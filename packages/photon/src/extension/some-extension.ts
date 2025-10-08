import type { Merge } from "type-fest";
import type { ZodRawShape, z } from "zod";
import type { App } from "../core/app.ts";
import type { SomeAction } from "../core/some-action.ts";
import type { ModOut, SomeModifier, SomeUniqueModifier } from "../core/some-modifier.ts";

export type ModifiersType = Record<string, (...args: any[]) => SomeModifier<any, any> | SomeUniqueModifier<any, any>>;
export type ActionsType = Record<string, (...args: any[]) => SomeAction<any>>;

export interface SomeExtension {
    modifiers: ModifiersType;
    actions: ActionsType;
    photonType: z.ZodObject<ZodRawShape>;
}

export type ModifiersOf<T extends SomeExtension> = T extends { modifiers: infer M } ? M : never;
export type ActionsOf<T extends SomeExtension> = T extends { actions: infer A } ? A : never;
