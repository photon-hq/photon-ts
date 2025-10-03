import type { Merge } from "type-fest";
import type { App } from "../core/app.ts";
import type { ModOut, SomeModifier, SomeUniqueModifier } from "../core/some-modifier.ts";

export interface SomeExtension {
    modifiers: Record<string, (...args: any[]) => SomeModifier<any, any> | SomeUniqueModifier<any, any>>;
}

export type ModifiersOf<T extends SomeExtension> = T["modifiers"];

export type ExtensionBuilder<N extends string, D extends string, P extends {}, E extends SomeExtension> = {
    [K in keyof ModifiersOf<E>]: (
        ...args: Parameters<ModifiersOf<E>[K]>
    ) => ReturnType<ModifiersOf<E>[K]> extends infer M
        ? App<N, D, Merge<P, ModOut<M>>, E> & ExtensionBuilder<N, D, Merge<P, ModOut<M>>, E>
        : never;
};
