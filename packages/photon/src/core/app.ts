import merge from "deepmerge";
import type { Merge, NonEmptyString, Simplify } from "type-fest";
import { defaultExtensions, type SomeExtension } from "../extensions";
import { Gateway } from "../gateway/server.ts";
import type { Target } from "../target.ts";
import type { CompiledPhoton, DeepMerge, IsBroadString, IsModuleApp, OmitUnique, PhotonOf, UniqueOf } from "../types";
import type { Context } from "./context.ts";
import type { SomeAction } from "./some-action.ts";
import type { SomeInvokable } from "./some-invokable.ts";
import type { AnyModifier } from "./some-modifier.ts";
import type { Invokable } from "../gateway/types";
import { da } from "zod/v4/locales";

export class App<
    Name extends string,
    Description extends string,
    Photon extends {} = Record<string, never>,
    Ext extends SomeExtension = typeof defaultExtensions,
> {
    public readonly name: Name | undefined;
    public readonly description: Description | undefined;

    private gateway!: Gateway;
    private invokables: Record<string, SomeInvokable> = {};

    photon: Photon;
    extensions: SomeExtension[] = [];

    public constructor();
    public constructor(name: NonEmptyString<Name>, description: NonEmptyString<Description>);
    public constructor(name?: NonEmptyString<Name>, description?: NonEmptyString<Description>) {
        this.name = name;
        this.description = description;
        this.photon = {} as Photon;
        this.extension(defaultExtensions);
    }

    public extension<NewExt extends SomeExtension>(
        ext: NewExt,
    ): App<Name, Description, Photon, DeepMerge<Ext, NewExt>> {
        this.extensions.push(ext);
        for (const [key, modifierFactory] of Object.entries(ext.modifiers)) {
            (this as any)[key] = (...args: any[]) => {
                const modifier = (modifierFactory as any)(...args) as AnyModifier<any, any>;
                return modifier.main(this as any);
            };
        }
        return this as any;
    }

    public use<A extends App<any, any, any, any>>(
        this: Photon extends UniqueOf<PhotonOf<A>> ? App<Name, Description, Photon, Ext> : never,
        moduleApp: IsModuleApp<A> extends true ? A : never,
    ): App<Name, Description, Simplify<OmitUnique<Merge<Photon, PhotonOf<A>>>>, Ext> {
        this.photon = merge(this.photon, moduleApp.photon);
        return this as any;
    }

    private context(userId: string, data: any = {}): Context<Ext> {
        const instance = {
            _app: this,
            gateway: this.gateway,
            user: {
                id: userId,
            },
            ...data
        };

        const actions = this.extensions.reduce((acc, ext) => merge(acc, ext.actions), {});

        for (const [key, actionFactory] of Object.entries(actions)) {
            (instance as any)[key] = async (...args: any[]) => {
                const action = (actionFactory as any)(...args) as SomeAction<any>;
                return await action.main(instance as any);
            };
        }

        return instance as any;
    }

    public invokable(key: string, invokable: SomeInvokable): void {
        this.invokables[key] = invokable;
    }

    private async useInvokable(data: Invokable): Promise<any> {
        const invokable = this.invokables[data.key];
        if (!invokable) {
            throw new Error(`Invokable with key "${data.key}" not found`);
        }
        return await invokable(this.context(data.userId, data.additionalData));
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
    public async deploy(
        this: IsBroadString<Name> extends true ? never : App<Name, Description, Photon, Ext>,
        first: string | Target,
        ...rest: Target[]
    ): Promise<void> {
        const isApiKeyProvided = typeof first === "string";
        const api_key = (isApiKeyProvided ? first : process.env.PHOTON_API) as unknown as string;
        const targets = (isApiKeyProvided ? rest : [first, ...rest]) as unknown as Target[];

        if (!api_key) {
            throw new Error(
                "API key is required. Provide it as first argument or set PHOTON_API environment variable.",
            );
        }

        const compiledPhoton = this.compilePhoton();

        console.log("\nCompiled Photon:");
        console.dir(compiledPhoton, { depth: null });
        console.log("\n");

        this.gateway = await Gateway.connect(api_key);

        this.gateway.Server.registerInvokableHandler(this.useInvokable.bind(this));

        await this.gateway.Server.register(compiledPhoton);

        for (const target of targets) {
            await target.start();
        }
    }
}
