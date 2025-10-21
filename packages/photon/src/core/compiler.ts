import { agentConfigSchema } from "../deploy/agent-config";
import { aware } from "../utils";
import type { Builder } from "./agent";
import type { Context } from "./context";

export type Compiler = (context: Context) => Promise<Context>;

export function buildCompiler(builder: Builder): Compiler {
    return async (_context_: Context) => {
        const context = _context_;

        while (true) {
            context.agentConfig = agentConfigSchema.parse({});

            try {
                await aware(context, async () => {
                    await builder();
                });

                break;
            } catch (error) {
                if (!(error instanceof RequestRecompile)) {
                    throw error;
                }
            }
        }

        return context;
    };
}

class RequestRecompile extends Error {
    constructor() {
        super("request recompile");
    }
}
