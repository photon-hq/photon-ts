import type { ZodObject } from "zod";
import type { SomeAction } from "../core/some-action.ts";

export type ActionsType = Record<string, (...args: any[]) => SomeAction<any>>;

export interface SomeExtension {
    actions: ActionsType;
    photonType?: ZodObject<any>;
}

export type ActionsOf<T extends SomeExtension> = T extends { actions: infer A } ? A : never;
