import type { NonEmptyString } from "type-fest";
import { z } from "zod";
import { defaultExtensions } from "../extensions.ts";
import { Gateway } from "../gateway/server.ts";
import type { Target } from "../target.ts";
import {
    BasePhoton,
    type CompiledPhoton,
    compiledPhotonSchema,
    type Merge,
    type ReturnWithUnique,
    type UniqueOf,
} from "../types";
import type { BaseModIn, BaseModOut, ModIn, ModOut, SomeBaseModifier, SomeModifier } from "./modifier.ts";

type AsPhoton<T> = T extends infer O ? { [k in keyof O]: O[k] } : never;

export type App<
    Name extends string,
    Description extends string,
    P extends object,
    Exts extends Record<string, (...args: any[]) => SomeModifier<any, any> | SomeBaseModifier<any, any, any>>,
> = {
    deploy: AppInstance<Name, Description, P>["deploy"];
    unwrap: () => AppInstance<Name, Description, P>;
    use<T extends object>(
        arg: T,
    ): T extends SomeModifier<any, any>
        ? P extends ModIn<T>
            ? App<Name, Description, AsPhoton<Merge<P, ModOut<T, P>>>, Exts>
            : never
        : P extends UniqueOf<T>
          ? App<Name, Description, AsPhoton<Merge<P, T>>, Exts>
          : never;
    extension<NewExt extends object>(
        ext: NewExt,
    ): App<Name, Description, P, Merge<Exts, NewExt extends { modifiers: infer M } ? M : NewExt>>;
} & {
    [K in keyof Exts]: ReturnType<Exts[K]> extends infer M
        ? M extends SomeBaseModifier<any, any, any>
            ? P extends BaseModIn<M>
                ? (...args: Parameters<Exts[K]>) => App<Name, Description, ReturnWithUnique<P, M>, Exts>
                : never
            : M extends SomeModifier<any, any>
              ? P extends ModIn<M>
                  ? (...args: Parameters<Exts[K]>) => App<Name, Description, AsPhoton<Merge<P, ModOut<M, P>>>, Exts>
                  : never
              : never
        : never;
};

const INTERNAL_CONSTRUCTOR = Symbol("INTERNAL_CONSTRUCTOR");

export function buildExtendedApi<
    Name extends string,
    Description extends string,
    P extends object,
    Exts extends Record<string, (...args: any[]) => SomeModifier<any, any> | SomeBaseModifier<any, any, any>>,
>(currentApp: AppInstance<Name, Description, P>, extensions: Exts): App<Name, Description, P, Exts> {
    const api = {
        deploy: currentApp.deploy.bind(currentApp),
        unwrap: () => currentApp,
        use: (arg: any) => {
            const newApp = (currentApp as any).modifier(arg);
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

            let newApp: AppInstance<Name, Description, any>;
            if ("base" in modifier) {
                newApp = (currentApp as any).baseModifier(modifier as SomeBaseModifier<any, any, any>);
            } else {
                newApp = (currentApp as any).modifier(modifier as SomeModifier<any, any>);
            }

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

    public constructor(
        _name: NonEmptyString<Name>,
        _description: NonEmptyString<Description>,
        secret: typeof INTERNAL_CONSTRUCTOR,
    ) {
        if (secret !== INTERNAL_CONSTRUCTOR) {
            throw new Error("AppInstance cannot be constructed directly, use App()");
        }
        this.photon = {} as Photon;
    }

    public asPhoton<O extends Merge<object, Omit<Photon, typeof BasePhoton>>>(): O {
        return null as any;
    }

    public use<P extends object>(
        this: Photon extends UniqueOf<P> ? AppInstance<Name, Description, Photon> : never,
        _photon: P,
    ): AppInstance<Name, Description, Merge<Photon, P>> {
        return this as any;
    }

    public modifier<M extends SomeModifier<any, any>>(
        this: Photon extends ModIn<M> ? AppInstance<Name, Description, Photon> : never,
        modifier: M,
    ): AppInstance<Name, Description, Merge<Photon, ModOut<M, Photon>>> {
        return modifier.main(this) as unknown as AppInstance<Name, Description, Merge<Photon, ModOut<M, Photon>>>;
    }

    public baseModifier<M extends SomeBaseModifier<any, any, any>>(
        this: Photon extends BaseModIn<M> ? AppInstance<Name, Description, Photon> : never,
        modifier: M,
    ): AppInstance<Name, Description, ReturnWithUnique<Photon, M>> {
        const next = modifier.main(this) as unknown as AppInstance<Name, Description, Merge<Photon, BaseModOut<M>>>;

        (next.photon as any)[BasePhoton] = modifier.base;

        return next as any;
    }

    private compilePhoton(): CompiledPhoton {
        return z.parse(compiledPhotonSchema, merge(this.photon, { name: this.name, description: this.description }));
    }

    public async deploy(
        this: IsModuleApp<this> extends true ? never : App<Name, Description, Photon, Extension>,
        api_key: string,
        ...targets: Target[]
    ): Promise<void>;
    public async deploy(
        this: IsModuleApp<this> extends true ? never : App<Name, Description, Photon, Extension>,
        ...targets: Target[]
    ): Promise<void>;
    public async deploy(
        this: IsModuleApp<this> extends true ? never : App<Name, Description, Photon, Extension>,
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

// biome-ignore lint: This function needs to be callable with 'new' keyword
export const App = function <Name extends string, Description extends string>(
    name: NonEmptyString<Name>,
    description: NonEmptyString<Description>,
) {
    const app = new AppInstance(name, description, INTERNAL_CONSTRUCTOR);
    return buildExtendedApi(app, defaultExtensions);
} as unknown as new <Name extends string, Description extends string>(
    name: NonEmptyString<Name>,
    description: NonEmptyString<Description>,
) => App<Name, Description, Record<string, never>, typeof defaultExtensions>;
