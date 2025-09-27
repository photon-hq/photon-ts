import { registry } from "./setup/registry.ts";
import type { App } from "../core/app.ts";
import type { Merge } from "type-fest";
import type { BaseModIn, ModOut, SomeBaseModifier, SomeModifier } from "../core/modifier.ts";
import type { ReturnWithUnique } from "../types/index.ts";

type RegistryShape = typeof registry;

type MethodFromEntry<K extends keyof RegistryShape> = RegistryShape[K] extends {
    mode: "modifier";
    create: (...args: infer A) => infer M;
}
    ? M extends SomeModifier<infer I, any>
        ? <Name extends string, Description extends string, Photon>(
              this: Photon extends I ? App<Name, Description, Photon> : never,
              ...args: A
          ) => App<Name, Description, Merge<Photon, ModOut<M, Photon>>>
        : never
    : RegistryShape[K] extends { mode: "base"; create: () => infer BM }
      ? BM extends SomeBaseModifier<any, any, any>
          ? <Name extends string, Description extends string, Photon>(
                this: Photon extends BaseModIn<BM> ? App<Name, Description, Photon> : never,
            ) => App<Name, Description, ReturnWithUnique<Photon, BM>>
          : never
      : never;

type MethodsFromRegistry = { [K in keyof RegistryShape]: MethodFromEntry<K> };

declare module "../core/app.ts" {
    interface App<Name extends string, Description extends string, Photon> extends MethodsFromRegistry {}
}

export {};
