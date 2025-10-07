import merge from "deepmerge";
import type { Merge, NonEmptyString } from "type-fest";
import {defaultExtensions} from "../modifiers/index.ts";
import {
    type DeepMerge,
    type IsBroadString,
    type ReturnWithUnique,
    type UniqueOf
} from "../types";
import type { ModIn, SomeModifier } from "./some-modifier.ts";
import type {ModifiersOf, SomeExtension} from "../extension";
import {AppInstance} from "./app-instance.ts";
import type {Target} from "../target.ts";

type AsPhoton<T> = T extends infer O ? { [k in keyof O]: O[k] } : never;

type IsModuleApp<A> = A extends App<infer N, any, any, any> ? IsBroadString<N> : never;
type PhotonOf<A> = A extends App<any, any, infer P, any> ? P : never

export type App<
    Name extends string,
    Description extends string,
    Photon extends object,
    Ext extends SomeExtension,
> = {
    deploy(
        this: IsBroadString<Name> extends true ? never : App<Name, Description, Photon, Ext>,
        api_key: string,
        ...targets: Target[]
    ): Promise<void>
    deploy(
        this: IsBroadString<Name> extends true ? never : App<Name, Description, Photon, Ext>,
        ...targets: Target[]
    ): Promise<void>;
    use<A extends App<any, any, any, any>>(
        this: Photon extends UniqueOf<PhotonOf<A>> ? App<Name, Description, Photon, Ext> : never,
        moduleApp: IsModuleApp<A> extends true ? A : never,
    ): App<Name, Description, Merge<Photon, PhotonOf<A>>, Ext>
    extension<NewExt extends SomeExtension>(
        ext: NewExt,
    ): App<Name, Description, Photon, DeepMerge<Ext, NewExt>>;
} & {
    [K in keyof ModifiersOf<Ext>]: ReturnType<ModifiersOf<Ext>[K]> extends infer M
        ? M extends SomeModifier<any, any>
            ? Photon extends ModIn<M>
                ? (...args: Parameters<ModifiersOf<Ext>[K]>) => App<Name, Description, AsPhoton<ReturnWithUnique<Photon, M>>, Ext>
                : never
            : never
        : never;
};

export function buildApp<
    Name extends string,
    Description extends string,
    P extends object,
    Ext extends SomeExtension,
>(currentApp: AppInstance<Name, Description, P>, extensions: Ext): App<Name, Description, P, Ext> {
    (currentApp as any)["extension"] = <NewExts extends SomeExtension>(ext: NewExts) => {
        const modifiers = ext.modifiers;
        return buildApp(currentApp, merge(extensions, ext));
    }

    for (const [key, modifierFactory] of Object.entries(extensions.modifiers)) {
        (currentApp as any)[key] = (...args: any[]) => {
            const modifier = modifierFactory(...args);
            const newApp = (currentApp as any).modifier(modifier as SomeModifier<any, any>);
            return buildApp(newApp, extensions);
        };
    }

    return currentApp as any;
}

// biome-ignore lint: This function needs to be callable with 'new' keyword
export const App = function <Name extends string = string, Description extends string = string>(
    name?: NonEmptyString<Name>,
    description?: NonEmptyString<Description>,
) {
    const app = name && description
        ? new AppInstance(name, description)
        : new AppInstance();

    return buildApp(app, defaultExtensions);

} as unknown as {
    new (): App<string, string, Record<string, never>, typeof defaultExtensions>;
    new <Name extends string, Description extends string>(
        name: NonEmptyString<Name>,
        description: NonEmptyString<Description>,
    ): App<Name, Description, Record<string, never>, typeof defaultExtensions>;
};