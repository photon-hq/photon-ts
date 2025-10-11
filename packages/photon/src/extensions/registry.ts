import type { Merge } from "type-fest";
import type { App } from "../core/app";
import type { Context } from "../core/context";
import type { ModIn, SomeModifier, SomeUniqueModifier } from "../core/some-modifier";
import type { onboardModifier } from "../modifiers";
import type { ReturnWithUnique } from "../types";
import type { SomeExtension } from "./some-extension";

type Registry<N extends string, D extends string, P extends {}, E extends SomeExtension> = {
    onboard: <A extends string>(
        action: (context: Context<E> & { type: A }) => void,
        type: A,
    ) => BuildModifierReturn<typeof onboardModifier, N, D, P, E>;
};

type MethodsFromRegistry<N extends string, D extends string, P extends {}, E extends SomeExtension> = {
    [K in keyof Registry<N, D, P, E>]: ReturnType<Registry<N, D, P, E>[K]> extends never
        ? never
        : ReturnType<Registry<N, D, P, E>[K]> extends App<any, any, any, any>
          ? Registry<N, D, P, E>[K]
          : never;
};

declare module "../core/app.ts" {
    interface App<Name extends string, Description extends string, Photon extends {}, Ext extends SomeExtension>
        extends MethodsFromRegistry<Name, Description, Photon, Ext> {}
}

// biome-ignore lint: This explore is nesscarry for the type checking of the registry.
export {};
