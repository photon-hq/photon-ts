import merge from "deepmerge";
import type { Merge, NonEmptyString } from "type-fest";
import { z } from "zod";
import { Gateway } from "./gateway/server.ts";
import { type ModIn, type ModOut, type SomeModifier } from "./modifiers/some-modifier.ts";
import type { Target } from "./target.ts";
import {
    type CompiledPhoton,
    compiledPhotonSchema,
    type IsBroadString,
    type ReturnWithUnique,
    type UniqueOf,
} from "./types";

type IsModuleApp<A> = A extends App<infer N, any, any> ? IsBroadString<N> : never;
type PhotonOf<A> = A extends App<any, any, infer P> ? P : never;

export class App<Name extends string, Description extends string, Photon extends {} = {}> {
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
    ): App<Name, Description, ReturnWithUnique<Photon, M>> {
        return modifier.main(this) as any;
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
