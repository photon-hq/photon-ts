import type { Context } from "./context.ts";

export type SomeInvokable = (context: Context<any>) => Promise<any>;
