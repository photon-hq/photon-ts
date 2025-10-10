import merge from "deepmerge";
import type { Except, Merge, NonEmptyString, Simplify } from "type-fest";
import type { defaultExtensions, ModifiersOf, SomeExtension, ModifiersType } from "../extensions";
import type { Target } from "../target.ts";
import type { DeepMerge, IsBroadString, OmitUnique, Promisable, ReturnWithUnique, UniqueOf } from "../types";
import { AppInstance } from "./app-instance.ts";
import type { Context } from "./context.ts";
import type { ModIn, ModOut, SomeModifier } from "./some-modifier.ts";
import "./attach.ts";

type IsModuleApp<A> = A extends App<infer N, any, any, any> ? IsBroadString<N> : never;
type PhotonOf<A> = A extends App<any, any, infer P, any> ? P : never;
type ActionContext<Ext extends SomeExtension> = (context: Context<Ext>) => Promisable<void>;

export type App<Name extends string, Description extends string, Photon extends {}, Ext extends SomeExtension> = {
    photon: Photon;
    deploy(
        this: IsBroadString<Name> extends true ? never : App<Name, Description, Photon, Ext>,
        api_key: string,
        ...targets: Target[]
    ): Promise<void>;
    deploy(
        this: IsBroadString<Name> extends true ? never : App<Name, Description, Photon, Ext>,
        ...targets: Target[]
    ): Promise<void>;
    modifier<M extends SomeModifier<any, any>>(
        this: Photon extends ModIn<M> ? App<Name, Description, Photon, Ext> : never,
        modifier: M,
    ): App<Name, Description, ReturnWithUnique<Photon, M>, Ext>;
    use<A extends App<any, any, any, any>>(
        this: Photon extends UniqueOf<PhotonOf<A>> ? App<Name, Description, Photon, Ext> : never,
        moduleApp: IsModuleApp<A> extends true ? A : never,
    ): App<Name, Description, Simplify<OmitUnique<Merge<Photon, PhotonOf<A>>>>, Ext>;
    extension<NewExt extends SomeExtension>(ext: NewExt): App<Name, Description, Photon, DeepMerge<Ext, NewExt>>;
    onboard(action?: ActionContext<Ext>): App<Name, Description, Merge<Photon, { onboard: {} }>, Ext>;
};

// biome-ignore lint: This function needs to be callable with 'new' keyword
export const App = function <Name extends string = string, Description extends string = string>(
    name?: NonEmptyString<Name>,
    description?: NonEmptyString<Description>,
) {
    const app = name && description ? new AppInstance(name, description) : new AppInstance();

    return app as unknown as App<Name, Description, {}, typeof defaultExtensions>;
} as unknown as {
    new (): App<string, string, {}, typeof defaultExtensions>;
    new <Name extends string, Description extends string>(
        name: NonEmptyString<Name>,
        description: NonEmptyString<Description>,
    ): App<Name, Description, {}, typeof defaultExtensions>;
};
