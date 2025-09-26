import { z } from "zod";
import type { PhotonPlugin } from "../types";

export interface PluginConfig<
    TName extends string,
    TType extends "base" | "modifier",
    TInputSchema extends z.ZodTypeAny,
    TOutputSchema extends z.ZodTypeAny,
    TMethods,
> {
    name: TName;
    type: TType;
    input?: TInputSchema;
    output: TOutputSchema;
    install: <TContext>(
        this: TContext,
        setState: (
            newState: Partial<
                TType extends "base" ? z.infer<TOutputSchema> : z.infer<TInputSchema>
            >,
        ) => void,
        getState: () => TType extends "base" ? z.infer<TOutputSchema> : z.infer<TInputSchema>,
    ) => TMethods;
}

export function createPlugin<
    TName extends string,
    TType extends "base" | "modifier",
    TInputSchema extends z.ZodTypeAny,
    TOutputSchema extends z.ZodTypeAny,
    TMethods,
>(
    config: PluginConfig<TName, TType, TInputSchema, TOutputSchema, TMethods>,
): PhotonPlugin<TName, TType, TInputSchema, TOutputSchema, TMethods> {
    return {
        name: config.name,
        type: config.type,
        inputSchema: config.input ?? (z.any() as unknown as TInputSchema),
        outputSchema: config.output,
        install: config.install,
    };
}
