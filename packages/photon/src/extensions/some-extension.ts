import type { Merge } from "type-fest";
import type { ZodRawShape, z } from "zod";
import type { App } from "../core/app.ts";
import type { SomeAction } from "../core/some-action.ts";
import type { ModOut, SomeModifier, SomeUniqueModifier } from "../core/some-modifier.ts";

export type ActionsType = Record<string, (...args: any[]) => SomeAction<any>>;

export interface SomeExtension {
    actions: ActionsType;
    photonType?: z.ZodObject<ZodRawShape>;
}

export type ActionsOf<T extends SomeExtension> = T extends { actions: infer A } ? A : never;
