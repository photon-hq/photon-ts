import type { App } from "../core/app";
import type { SomeExtension } from "../core/some-extension";
import type { EveryMessageRegistry, OnboardRegistry } from "../modifiers";
import type { ExtensionsOf } from "../types";

type Registry<A extends App<any, any>, E extends SomeExtension> = {
    onboard: OnboardRegistry<A, E>;
    everyMessage: EveryMessageRegistry<A, E>;
};

type MethodsFromRegistry<A extends App<any, any, any, any>> = {
    [K in keyof Registry<A, ExtensionsOf<A>>]: ReturnType<Registry<A, ExtensionsOf<A>>[K]> extends never
        ? never
        : ReturnType<Registry<A, ExtensionsOf<A>>[K]> extends App<any, any, any, any>
          ? Registry<A, ExtensionsOf<A>>[K]
          : never;
};

declare module "../core/app.ts" {
    interface App<Name extends string, Description extends string, Photon extends {}, Ext extends SomeExtension>
        extends MethodsFromRegistry<App<Name, Description, Photon, Ext>> {}
}

// biome-ignore lint: This explore is nesscarry for the type checking of the registry.
export {};
