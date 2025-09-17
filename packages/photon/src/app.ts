import type {Modified, SomeModifier} from "./modifiers/some-modifier.ts";
import type {Target} from "./target.ts";
import {Gateway} from "./gateway/server.ts";
import type {NonEmptyString} from "./magictype";

export class App<
    Name extends string,
    Description extends string,
    Photon extends {} = {}
> {
    private readonly name: Name;
    private readonly description: Description;

    private photon: Photon;

    public constructor(name: NonEmptyString<Name>, description: NonEmptyString<Description>) {
        this.name = name;
        this.description = description;

        this.photon = {} as Photon;
    }

    public use<M extends SomeModifier<this, any>>(modifier: M): Modified<M, this> {
        return modifier.main(this);
    }

    public async deploy(api_key: string, ...targets: Target[]): Promise<void>;
    public async deploy(...targets: Target[]): Promise<void>;
    public async deploy(first: string | Target, ...rest: Target[]): Promise<void> {
        const isApiKeyProvided = typeof first === 'string';
        const api_key = isApiKeyProvided ? first : process.env.SOMETHING_API!;
        const targets = isApiKeyProvided ? rest : [first, ...rest];

        const gateway = await Gateway.connect(api_key)

        for (const target of targets) {
            await target.start()
        }
    }
}