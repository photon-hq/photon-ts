import type { Builder } from "../core/agent";
import type { RootAgentDef } from "./agent-def";
import type { _Target } from "./target"
import type { Context } from "../core/context";

export class Deployable {
    private readonly builder: Builder;

    constructor(builder: Builder) {
        this.builder = builder;
    }

    private compile(context: Context): RootAgentDef  {
        return null as any
    }

    async deploy(projectKey: string | undefined = process.env.PROJECT_KEY, ...targets: _Target[]): Promise<void> {
        if (!projectKey) {
            throw new Error("Project key is required");
        }
    }
}
