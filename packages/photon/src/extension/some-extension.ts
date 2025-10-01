import type {BaseModIn, SomeBaseModifier, SomeModifier, SomeUniqueBaseModifier} from "../core/modifier.ts";
import type {ExtendedApp} from "../create-app.ts";

export interface SomeExtension {
    modifiers: Record<string, (...args: any[]) => SomeModifier<any, any> | SomeBaseModifier<any, any, any>>
}

export type ModifiersOf<T extends SomeExtension> = T['modifiers'];