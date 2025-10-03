import type { Merge, NonEmptyString } from "type-fest";
import { z } from "zod";
import type { ExtensionBuilder, ModifiersOf, SomeExtension } from "../extension";
import { Gateway } from "../gateway/server.ts";
import type { Target } from "../target.ts";
import {
    type CompiledPhoton,
    compiledPhotonSchema,
    type DeepMerge,
    type IsBroadString,
    type ReturnWithUnique,
    type UniqueOf,
} from "../types";
import { Gateway } from "./gateway/server.ts";
import {
    type BaseModIn,
    type BaseModOut,
    type ModIn,
    type ModOut,
    type SomeBaseModifier,
    type SomeModifier,
} from "./modifiers/some-modifier.ts";
import type { ModIn, ModOut, SomeBaseModifier, SomeModifier } from "./some-modifier.ts";
import type { Target } from "./target.ts";
import merge from "deepmerge";

type IsModuleApp<A> = A extends App<infer N, any, any> ? IsBroadString<N> : never;
type PhotonOf<A> = A extends App<any, any, infer P> ? P : never;

export class App<
    Name extends string,
    Description extends string,
    Photon extends {} = {},
    _Ext extends SomeExtension = { modifiers: {} },
> {
    private readonly name: Name | undefined;
    private readonly description: Description | undefined;

    photon: Photon;

    public constructor();
    public constructor(name: NonEmptyString<Name>, description: NonEmptyString<Description>);

    public constructor(name?: NonEmptyString<Name>, description?: NonEmptyString<Description>) {
        this.name = name;
        this.description = description;
        this.photon = {} as Photon;
    }

    public use<A extends App<any, any, any>>(
        this: Photon extends UniqueOf<PhotonOf<this>> ? App<Name, Description, Photon> : never,
        moduleApp: IsModuleApp<A> extends true ? A : never,
    ): App<Name, Description, Merge<Photon, PhotonOf<A>>> {
        this.photon = merge(this.photon, moduleApp.photon);
        return this as any;
    }

    public modifier<M extends SomeModifier<any, any>>(
        this: Photon extends ModIn<M> ? App<Name, Description, Photon> : never,
        modifier: M,
    ): App<Name, Description, Merge<Photon, ModOut<M, Photon>>, _Ext> {
        return modifier.main(this) as any;
    }

    public extension<Ext extends SomeExtension>(
        ext: Ext,
    ): App<Name, Description, Photon, DeepMerge<Ext, _Ext>> &
        ExtensionBuilder<Name, Description, Photon, DeepMerge<Ext, _Ext>> {
        for (const [key, modifierFactory] of Object.entries(ext.modifiers)) {
            (this as any)[key] = (...args: any[]) => {
                const modifier = modifierFactory(...args);

                if ("base" in modifier) {
                    return (this as any).baseModifier(modifier as SomeBaseModifier<any, any, any>);
                } else {
                    return (this as any).modifier(modifier as SomeModifier<any, any>);
                }
            };
        }

        return this as any;
    }

    private compilePhoton(): CompiledPhoton {
        return z.parse(compiledPhotonSchema, merge(this.photon, { name: this.name, description: this.description }));
    }

    public async deploy(
        this: IsModuleApp<this> extends true ? never : App<Name, Description, Photon>,
        api_key: string,
        ...targets: Target[]
    ): Promise<void>;
    public async deploy(
        this: IsModuleApp<this> extends true ? never : App<Name, Description, Photon>,
        ...targets: Target[]
    ): Promise<void>;
    public async deploy(
        this: IsModuleApp<this> extends true ? never : App<Name, Description, Photon>,
        first: string | Target,
        ...rest: Target[]
    ): Promise<void> {
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
