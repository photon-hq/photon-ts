import merge from "deepmerge";
import type { Merge, NonEmptyString } from "type-fest";
import { z } from "zod";
import type { ExtensionBuilder, SomeExtension } from "../extension";
import { Gateway } from "../gateway/server.ts";
import { defaultExtensions } from "../modifiers/index.ts";
import type { Target } from "../target.ts";
import { type CompiledPhoton, compiledPhotonSchema, type DeepMerge, type IsBroadString, type UniqueOf } from "../types";
import type { ModIn, ModOut, SomeModifier } from "./some-modifier.ts";

type AsPhoton<T> = T extends infer O ? { [k in keyof O]: O[k] } : never;

type IsModuleApp<A> = A extends AppInstance<infer N, any, any> ? IsBroadString<N> : never;
type PhotonOf<A> = A extends AppInstance<any, any, infer P> ? P : never;

export type App<
    Name extends string,
    Description extends string,
    P extends object,
    Exts extends Record<string, (...args: any[]) => SomeModifier<any, any>>,
> = {
    deploy: AppInstance<Name, Description, P>["deploy"];
    unwrap: () => AppInstance<Name, Description, P>;
    use<T extends object>(
        arg: T,
    ): T extends SomeModifier<any, any>
        ? P extends ModIn<T>
            ? App<Name, Description, AsPhoton<Merge<P, ModOut<T>>>, Exts>
            : never
        : P extends UniqueOf<T>
          ? App<Name, Description, AsPhoton<Merge<P, T>>, Exts>
          : never;
    extension<NewExt extends object>(
        ext: NewExt,
    ): App<Name, Description, P, Merge<Exts, NewExt extends { modifiers: infer M } ? M : NewExt>>;
} & {
    [K in keyof Exts]: ReturnType<Exts[K]> extends infer M
        ? M extends SomeModifier<any, any>
            ? P extends ModIn<M>
                ? (...args: Parameters<Exts[K]>) => App<Name, Description, AsPhoton<Merge<P, ModOut<M>>>, Exts>
                : never
            : never
        : never;
};

export function buildExtendedApi<
    Name extends string,
    Description extends string,
    P extends object,
    Exts extends Record<string, (...args: any[]) => SomeModifier<any, any>>,
>(currentApp: AppInstance<Name, Description, P>, extensions: Exts): App<Name, Description, P, Exts> {
    const api = {
        deploy: currentApp.deploy.bind(currentApp),
        unwrap: () => currentApp,
        use: (arg: any) => {
            const newApp = (currentApp as any).use(arg);
            return buildExtendedApi(newApp, extensions);
        },
        extension: <NewExts extends object>(ext: NewExts) => {
            const modifiers = (
                "modifiers" in ext && ext.modifiers && typeof ext.modifiers === "object" ? ext.modifiers : ext
            ) as Record<string, any>;
            return buildExtendedApi(currentApp, { ...extensions, ...modifiers });
        },
    } as App<Name, Description, P, Exts>;

    for (const [key, modifierFactory] of Object.entries(extensions)) {
        (api as any)[key] = (...args: any[]) => {
            const modifier = modifierFactory(...args);
            const newApp = (currentApp as any).modifier(modifier as SomeModifier<any, any>);
            return buildExtendedApi(newApp, extensions);
        };
    }

    return api;
}

export class AppInstance<
    Name extends string,
    Description extends string,
    Photon extends object = Record<string, never>,
> {
    private readonly name: Name | undefined;
    private readonly description: Description | undefined;

    photon: Photon;

    public constructor()
    public constructor(name: NonEmptyString<Name>, description: NonEmptyString<Description>)
    public constructor(name?: NonEmptyString<Name>, description?: NonEmptyString<Description>) {
        this.name = name;
        this.description = description;
        this.photon = {} as Photon;
    }

    public use<A extends AppInstance<any, any, any>>(
        this: Photon extends UniqueOf<PhotonOf<this>> ? AppInstance<Name, Description, Photon> : never,
        moduleApp: IsModuleApp<A> extends true ? A : never,
    ): AppInstance<Name, Description, Merge<Photon, PhotonOf<A>>> {
        this.photon = merge(this.photon, moduleApp.photon);
        return this as any;
    }

    public modifier<M extends SomeModifier<any, any>>(
        this: Photon extends ModIn<M> ? AppInstance<Name, Description, Photon> : never,
        modifier: M,
    ): AppInstance<Name, Description, Merge<Photon, ModOut<M>>> {
        return modifier.main(this as any) as any;
    }

    private compilePhoton(): CompiledPhoton {
        return z.parse(compiledPhotonSchema, merge(this.photon, { name: this.name, description: this.description }));
    }

    public async deploy(api_key: string, ...targets: Target[]): Promise<void>;
    public async deploy(...targets: Target[]): Promise<void>;
    public async deploy(first: string | Target, ...rest: Target[]): Promise<void> {
        const isApiKeyProvided = typeof first === "string";
        const api_key = isApiKeyProvided ? first : process.env.PHOTON_API;
        const targets = isApiKeyProvided ? rest : [first, ...rest];

        if (!api_key) {
            throw new Error(
                "API key is required. Provide it as first argument or set PHOTON_API environment variable.",
            );
        }

        const compiledPhoton = this.compilePhoton();

        console.log("\nCompiled Photon:");
        console.dir(compiledPhoton, { depth: null });
        console.log("\n");

        const gateway = await Gateway.connect(api_key);

        await gateway.Server.register(compiledPhoton);

        for (const target of targets) {
            await target.start();
        }
    }
}

// biome-ignore lint: This function needs to be callable with 'new' keyword
export const App = function <Name extends string = string, Description extends string = string>(
    name?: NonEmptyString<Name>,
    description?: NonEmptyString<Description>,
) {
    const app = name && description
        ? new AppInstance(name, description)
        : new AppInstance();

    return buildExtendedApi(app, defaultExtensions);

} as unknown as {
    new (): App<string, string, Record<string, never>, typeof defaultExtensions>;
    new <Name extends string, Description extends string>(
        name: NonEmptyString<Name>,
        description: NonEmptyString<Description>,
    ): App<Name, Description, Record<string, never>, typeof defaultExtensions>;
};