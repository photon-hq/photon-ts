import merge from "deepmerge";
import type { NonEmptyString } from "type-fest";
import { z } from "zod";
import type { SomeExtension } from "../extensions/index.ts";
import { Gateway } from "../gateway/server.ts";
import type { Target } from "../target.ts";
import { type CompiledPhoton, compiledPhotonSchema, type ReturnWithUnique } from "../types";
import { buildApp } from "./app.ts";
import { defaultExtensions } from "../extensions";
import type { ModIn, SomeModifier } from "./some-modifier.ts";

export class AppInstance<Name extends string, Description extends string, Photon extends {} = Record<string, never>> {
    private readonly name: Name | undefined;
    private readonly description: Description | undefined;
    private gateway!: Gateway;

    photon: Photon;
    extensions: SomeExtension[] = [defaultExtensions];

    public constructor();
    public constructor(name: NonEmptyString<Name>, description: NonEmptyString<Description>);
    public constructor(name?: NonEmptyString<Name>, description?: NonEmptyString<Description>) {
        this.name = name;
        this.description = description;
        this.photon = {} as Photon;
    }

    public modifier<M extends SomeModifier<any, any>>(
        this: Photon extends ModIn<M> ? AppInstance<Name, Description, Photon> : never,
        modifier: M,
    ): any {
        return buildApp(modifier.main(buildApp(this)));
    }

    private use(moduleApp: AppInstance<any, any, any>): any {
        this.photon = merge(this.photon, moduleApp.photon);
        return buildApp(this);
    }

    private compilePhoton(): CompiledPhoton {
        const _photon = merge(this.photon, { name: this.name, description: this.description });

        return this.extensions.reduce(
            (acc, ext) => merge(acc, ext.photonType.strip().parse(_photon) as object),
            {},
        ) as unknown as CompiledPhoton;
    }

    private async deploy(first: string | Target, ...rest: Target[]): Promise<void> {
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
