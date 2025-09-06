import type {SomeModifier} from "./modifier/some-modifier.ts";
import type {Target} from "./target.ts";

export interface Options {

}

export class App {
    private readonly name: string;
    private readonly description: string;
    private readonly options: Options;

    public constructor(name: string, description: string, options: Options) {
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

    public deploy(...targets: Target[]): void {

    }
}

const app = new App('something', 'something', {});