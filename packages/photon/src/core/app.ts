import merge from "deepmerge";
import type { Merge, NonEmptyString, Simplify } from "type-fest";
import { defaultExtensions, type SomeExtension } from "../extensions";
import { Gateway } from "../gateway/server.ts";
import type { Target } from "../target.ts";
import {
    type CompiledPhoton,
    type DeepMerge,
    type IsBroadString,
    type OmitUnique,
    type PhotonOf,
    type UniqueOf,
    type IsModuleApp
} from "../types";

export class App<
    Name extends string,
    Description extends string,
    Photon extends {} = Record<string, never>,
    Ext extends SomeExtension = typeof defaultExtensions,
> {
    public readonly name: Name | undefined;
    public readonly description: Description | undefined;

    public photon: Photon;
    extensions: SomeExtension[] = [defaultExtensions];

    public constructor();
    public constructor(name: NonEmptyString<Name>, description: NonEmptyString<Description>);
    public constructor(name?: NonEmptyString<Name>, description?: NonEmptyString<Description>) {
        this.name = name;
        this.description = description;
        this.photon = {} as Photon;
    }

    public extension<NewExt extends SomeExtension>(
        ext: NewExt,
    ): App<Name, Description, Photon, DeepMerge<Ext, NewExt>> {
        this.extensions.push(ext);
        return this as any;
    }

    public use<A extends App<any, any, any, any>>(
        this: Photon extends UniqueOf<PhotonOf<A>> ? App<Name, Description, Photon, Ext> : never,
        moduleApp: IsModuleApp<A> extends true ? A : never,
    ): App<Name, Description, Simplify<OmitUnique<Merge<Photon, PhotonOf<A>>>>, Ext> {
        this.photon = merge(this.photon, moduleApp.photon);
        return this as any;
    }

    private compilePhoton(): CompiledPhoton {
        const _photon = merge(this.photon, { name: this.name, description: this.description });

        return this.extensions
            .filter(
                (ext): ext is SomeExtension & { photonType: NonNullable<SomeExtension["photonType"]> } =>
                    ext.photonType !== undefined,
            )
            .reduce(
                (acc, ext) => merge(acc, ext.photonType.strip().parse(_photon) as object),
                {},
            ) as unknown as CompiledPhoton;
    }

    public async deploy(
        this: IsBroadString<Name> extends true ? never : App<Name, Description, Photon, Ext>,
        api_key: string,
        ...targets: Target[]
    ): Promise<void>;
    public async deploy(
        this: IsBroadString<Name> extends true ? never : App<Name, Description, Photon, Ext>,
        ...targets: Target[]
    ): Promise<void>;
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
