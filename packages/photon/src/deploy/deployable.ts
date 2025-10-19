import type { Builder } from "../core/agent";
import type { Context } from "../core/context";
import type { RootAgentScope } from "./compiled";
import type { _Target } from "./target"

export class Deployable {
    private readonly builder: Builder;
    
    constructor(builder: Builder) {
        this.builder = builder;
    }
    
    compile(context: Context): RootAgentScope  {
        return null as any
    }
    
    async deploy(projectKey: string | undefined = process.env.PROJECT_KEY, ...targets: _Target[]): Promise<void> {
        if (!projectKey) {
            throw new Error("Project key is required");
        }
    }
}