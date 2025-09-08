import type {SomeModifier} from "./modifier/some-modifier.ts";
import type {Target} from "./target.ts";
import {connectSomethingServer} from "./io-server/connect.ts";

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

    public deploy(...targets: Target[]): void {
        connectSomethingServer()
    }
}