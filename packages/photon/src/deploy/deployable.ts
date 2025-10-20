import type { Compiler } from "../core/compiler";
import type { Context } from "../core/context";
import type { _Target } from "./target";

export class Deployable {
    private compilers: Record<string, Compiler>;

    constructor(rootCompiler: Compiler) {
        this.compilers = {
            "": rootCompiler,
        };
    }

    private async compile(context: Context): Promise<Context> {
        const compiler = this.compilers[context.scope_name];
        if (!compiler) {
            throw new Error(`Compiler not found for scope ${context.scope_name}`);
        }
        return await compiler(context);
    }

    async deploy(projectKey: string | undefined = process.env.PROJECT_KEY, ...targets: _Target[]): Promise<void> {
        if (!projectKey) {
            throw new Error("Project key is required");
        }
    }
}
