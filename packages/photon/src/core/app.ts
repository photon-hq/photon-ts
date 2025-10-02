import type { Merge, NonEmptyString } from "type-fest";
import { z } from "zod";
import type { ExtensionBuilder, ModifiersOf, SomeExtension } from "../extension";
import { Gateway } from "../gateway/server.ts";
import type { Target } from "../target.ts";
import {
    BasePhoton,
    type CompiledPhoton,
    compiledPhotonSchema,
    type DeepMerge,
    type ReturnWithUnique,
    type UniqueOf,
} from "../types";
import type { BaseModIn, BaseModOut, ModIn, ModOut, SomeBaseModifier, SomeModifier } from "./some-modifier.ts";

export class App<
    Name extends string,
    Description extends string,
    Photon extends {} = {},
    _Ext extends SomeExtension = { modifiers: {} },
> {
    photon: Photon;

    public constructor(name: NonEmptyString<Name>, description: NonEmptyString<Description>) {
        this.photon = {} as Photon;
    }

    public asPhoton<O extends Merge<object, Omit<Photon, typeof BasePhoton>>>(): O {
        return null as any;
    }

    public use<P extends object>(
        this: Photon extends UniqueOf<P> ? App<Name, Description, Photon> : never,
        _photon: P,
    ): App<Name, Description, Merge<Photon, P>> {
        return this as any;
    }

    public modifier<M extends SomeModifier<any, any>>(
        this: Photon extends ModIn<M> ? App<Name, Description, Photon> : never,
        modifier: M,
    ): App<Name, Description, Merge<Photon, ModOut<M, Photon>>> &
        ExtensionBuilder<Name, Description, ModOut<M, Photon>, _Ext> {
        return modifier.main(this) as any;
    }

    public baseModifier<M extends SomeBaseModifier<any, any, any>>(
        this: Photon extends BaseModIn<M> ? App<Name, Description, Photon> : never,
        modifier: M,
    ): App<Name, Description, ReturnWithUnique<Photon, M>> &
        ExtensionBuilder<Name, Description, ReturnWithUnique<Photon, M>, _Ext> {
        const next = modifier.main(this) as any;

        (next.photon as any)[BasePhoton] = modifier.base;

        return next as any;
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
        return z.parse(compiledPhotonSchema, this.photon);
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
