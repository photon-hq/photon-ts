import {
    type BaseModIn,
    type BaseModOut,
    type ModIn,
    type ModOut,
    type SomeBaseModifier,
    type SomeModifier,
} from "./modifiers/some-modifier.ts";
import type { Target } from "./target.ts";
import { Gateway } from "./gateway/server.ts";
import type { Merge, NonEmptyString } from "type-fest";
import { BasePhoton, type ReturnWithUnique, type UniqueOf } from "./types";
import { type CompiledPhoton, compiledPhotonSchema } from "./types";
import { z } from "zod";

export class App<Name extends string, Description extends string, Photon extends {} = {}> {
    private readonly name: Name;
    private readonly description: Description;

    photon: Photon;

    public constructor(name: NonEmptyString<Name>, description: NonEmptyString<Description>) {
        this.name = name;
        this.description = description;

        this.photon = {} as Photon;
    }

    public asPhoton<O extends Merge<{}, Omit<Photon, typeof BasePhoton>>>(): O {
        return null as any;
    }

    public use<P extends {}>(
        this: Photon extends UniqueOf<P> ? App<Name, Description, Photon> : never,
        photon: P,
    ): App<Name, Description, Merge<Photon, P>> {
        return this as any;
    }

    public modifier<M extends SomeModifier<any, any>>(
        this: Photon extends ModIn<M> ? App<Name, Description, Photon> : never,
        modifier: M,
    ): App<Name, Description, Merge<Photon, ModOut<M, Photon>>> {
        return modifier.main(this) as unknown as App<Name, Description, Merge<Photon, ModOut<M, Photon>>>;
    }

    public baseModifier<M extends SomeBaseModifier<any, any, any>>(
        this: Photon extends BaseModIn<M> ? App<Name, Description, Photon> : never,
        modifier: M,
    ): App<Name, Description, ReturnWithUnique<Photon, M>> {
        const next = modifier.main(this) as unknown as App<Name, Description, Merge<Photon, BaseModOut<M>>>;

        (next.photon as any)[BasePhoton] = modifier.base;

        return next as any;
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
