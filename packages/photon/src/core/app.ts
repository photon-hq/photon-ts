import merge from "deepmerge";
import type {Except, Merge, NonEmptyString, Simplify} from "type-fest";
import {defaultExtensions} from "../modifiers";
import {
    type DeepMerge,
    type IsBroadString, type OmitUnique,
    type ReturnWithUnique,
    type UniqueOf,
} from "../types";
import type { ModIn, SomeModifier } from "./some-modifier.ts";
import type {ModifiersOf, ModifiersType, SomeExtension} from "../extension";
import {AppInstance} from "./app-instance.ts";
import type {Target} from "../target.ts";

type IsModuleApp<A> = A extends App<infer N, any, any, any> ? IsBroadString<N> : never;
type PhotonOf<A> = A extends App<any, any, infer P, any> ? P : never

export type App<Name extends string, Description extends string, Photon extends {}, Ext extends SomeExtension> = {
    photon: Photon
    deploy(
        this: IsBroadString<Name> extends true ? never : App<Name, Description, Photon, Ext>,
        api_key: string,
        ...targets: Target[]
    ): Promise<void>
    deploy(
        this: IsBroadString<Name> extends true ? never : App<Name, Description, Photon, Ext>,
        ...targets: Target[]
    ): Promise<void>
    modifier<M extends SomeModifier<any, any>>(
        this: Photon extends ModIn<M> ? App<Name, Description, Photon, Ext> : never,
        modifier: M,
    ): App<Name, Description, ReturnWithUnique<Photon, M>, Ext>
    use<A extends App<any, any, any, any>>(
        this: Photon extends UniqueOf<PhotonOf<A>> ? App<Name, Description, Photon, Ext> : never,
        moduleApp: IsModuleApp<A> extends true ? A : never,
    ): App<Name, Description, Simplify<OmitUnique<Merge<Photon, PhotonOf<A>>>>, Ext>
    extension<NewExt extends SomeExtension>(
        ext: NewExt,
    ): App<Name, Description, Photon, DeepMerge<Ext, NewExt>>;
} & {
    [K in keyof ModifiersOf<Ext>]: ReturnType<ModifiersOf<Ext>[K]> extends infer M
        ? M extends SomeModifier<any, any>
            ? Photon extends ModIn<M>
                ? (
                    ...args: Parameters<ModifiersOf<Ext>[K]>
                ) => App<Name, Description, ReturnWithUnique<Photon, M>, Ext>
                : never
            : never
        : never;
};

export function buildApp<Name extends string, Description extends string, P extends {}>(
    instance: AppInstance<Name, Description, P>,
): App<Name, Description, P, any> {
    const modifiers: ModifiersType = instance.extensions.reduce((acc, ext) => merge(acc, ext.modifiers), {});

    (instance as any)["extension"] = <NewExts extends SomeExtension>(ext: NewExts) => {
        instance.extensions.push(ext);
        const modifiers = ext.modifiers;
        return buildApp(instance);
    }

    for (const [key, modifierFactory] of Object.entries(modifiers)) {
        (instance as any)[key] = (...args: any[]) => {
            const modifier = modifierFactory(...args);
            const newApp = (instance as any).modifier(modifier as SomeModifier<any, any>);
            return buildApp(newApp);
        };
    }

    return instance as any;
}

// biome-ignore lint: This function needs to be callable with 'new' keyword
export const App = function <Name extends string = string, Description extends string = string>(
    name?: NonEmptyString<Name>,
    description?: NonEmptyString<Description>,
) {
    const app = name && description ? new AppInstance(name, description) : new AppInstance();

    return buildApp(app);
} as unknown as {
    new (): App<string, string, Record<string, never>, typeof defaultExtensions>;
    new <Name extends string, Description extends string>(
        name: NonEmptyString<Name>,
        description: NonEmptyString<Description>,
    ): App<Name, Description, Record<string, never>, typeof defaultExtensions>;
};