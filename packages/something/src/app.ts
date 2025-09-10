import type {SomeModifier} from "./modifiers/some-modifier.ts";
import type {Target} from "./target.ts";
import {Gateway} from "./gateway/server.ts";

export interface Options {

}

export class App {
    private readonly name: string;
    private readonly description: string;
    private readonly options: Options | null;

    public constructor(name: string, description: string, options: Options | null = null) {
        if (!name) {
            console.error('name is required');
            process.exit(1);
        }

        this.name = name;
        this.description = description;
        this.options = options;
    }

    public use(modifier: SomeModifier): App {
        return this;
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