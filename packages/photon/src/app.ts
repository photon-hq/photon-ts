import type {ModIn, ModOut, SomeModifier} from "./modifiers/some-modifier.ts";
import type {Target} from "./target.ts";
import {Gateway} from "./gateway/server.ts";
import type {Merge, NonEmptyString} from "type-fest";

export class App<
    Name extends string,
    Description extends string,
    Photon extends {} = {}
> {
    private readonly name: Name;
    private readonly description: Description;

    photon: Photon;

    public constructor(name: NonEmptyString<Name>, description: NonEmptyString<Description>) {
        this.name = name;
        this.description = description;

        this.photon = {} as Photon;
    }

    public modifier<M extends SomeModifier<any, any>>(
        this: Photon extends ModIn<M> ? App<Name, Description, Photon> : never,
        modifier: M
    ): App<Name, Description, Merge<Photon, ModOut<M>>> {
        return modifier.main(this) as unknown as App<
            Name,
            Description,
            Merge<Photon, ModOut<M>>
        >;
    }

    public async deploy(api_key: string, ...targets: Target[]): Promise<void>;
    public async deploy(...targets: Target[]): Promise<void>;
    public async deploy(first: string | Target, ...rest: Target[]): Promise<void> {
        const isApiKeyProvided = typeof first === 'string';
        const api_key = isApiKeyProvided ? first : process.env.PHOTON_API!;
        const targets = isApiKeyProvided ? rest : [first, ...rest];

        const gateway = await Gateway.connect(api_key)

        for (const target of targets) {
            await target.start()
        }
    }
}