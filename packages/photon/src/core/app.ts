import merge from "deepmerge";
import type { Merge, NonEmptyString } from "type-fest";
import { z } from "zod";
import { Gateway } from "../gateway/server.ts";
import {defaultExtensions, onboardModifier} from "../modifiers/index.ts";
import type { Target } from "../target.ts";
import {
    type CompiledPhoton,
    compiledPhotonSchema,
    type DeepMerge,
    type IsBroadString,
    type ReturnWithUnique,
    type UniqueOf
} from "../types";
import type { ModIn, ModOut, SomeModifier } from "./some-modifier.ts";
import type {ModifiersOf, SomeExtension} from "../extension";

type AsPhoton<T> = T extends infer O ? { [k in keyof O]: O[k] } : never;

type IsModuleApp<A> = A extends AppInstance<infer N, any, any> ? IsBroadString<N> : (A extends App<infer N, any, any, any> ? IsBroadString<N> : never);
type PhotonOf<A> = A extends AppInstance<any, any, infer P> ? P : (A extends App<any, any, infer P, any> ? P : never);

export type App<
    Name extends string,
    Description extends string,
    Photon extends object,
    Ext extends SomeExtension,
> = {
    deploy: AppInstance<Name, Description, Photon>["deploy"];
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

export function buildExtendedApi<
    Name extends string,
    Description extends string,
    P extends object,
    Ext extends SomeExtension,
>(currentApp: AppInstance<Name, Description, P>, extensions: Ext): App<Name, Description, P, Ext> {
    const api = {
        deploy: currentApp.deploy.bind(currentApp),
        use: (arg: any) => {
            const newApp = (currentApp as any).use(arg);
            return buildExtendedApi(newApp, extensions);
        },
        extension: <NewExts extends SomeExtension>(ext: NewExts) => {
            const modifiers = ext.modifiers;
            return buildExtendedApi(currentApp, merge(extensions, ext));
        },
    } as App<Name, Description, P, Ext>;

    for (const [key, modifierFactory] of Object.entries(extensions.modifiers)) {
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
        this: Photon extends UniqueOf<PhotonOf<A>> ? AppInstance<Name, Description, Photon> : never,
        moduleApp: IsModuleApp<A> extends true ? A : never,
    ): AppInstance<Name, Description, Merge<Photon, PhotonOf<A>>> {
        this.photon = merge(this.photon, moduleApp.photon);
        return this as any;
    }

    public modifier<M extends SomeModifier<any, any>>(
        this: Photon extends ModIn<M> ? AppInstance<Name, Description, Photon> : never,
        modifier: M,
    ): AppInstance<Name, Description, ReturnWithUnique<Photon, M>> {
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

const a1 = new AppInstance().modifier(onboardModifier(() => {}))
const a2 = new AppInstance("hi", "hi")
a2.use(a1)