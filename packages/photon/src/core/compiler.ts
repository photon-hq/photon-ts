import { aware } from "../utils";
import type { Builder } from "./agent";
import type { Context } from "./context";

export type Compiler = (context: Context) => Promise<Context>;

export function buildCompiler(builder: Builder): Compiler {
    return async (_context_: Context) => {
        return await aware(_context_, (context) => {
            builder();
            return context;
        });
    };
}
