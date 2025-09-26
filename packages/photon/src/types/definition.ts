import type { ZodType, infer as zInfer } from "zod";

export const BasePhoton = Symbol("base");

export interface PhotonPlugin<
    TName extends string,
    TType extends "base" | "modifier",
    TInputSchema extends ZodType,
    TOutputSchema extends ZodType,
    TMethods,
> {
    name: TName;
    type: TType;
    inputSchema: TInputSchema;
    outputSchema: TOutputSchema;
    install: <TContext>(
        this: TContext,
        setState: (
            newState: Partial<TType extends "base" ? zInfer<TOutputSchema> : zInfer<TInputSchema>>,
        ) => void,
        getState: () => TType extends "base" ? zInfer<TOutputSchema> : zInfer<TInputSchema>,
    ) => TMethods;
}

export type PluginInput<T extends PhotonPlugin<any, any, any, any, any>> = zInfer<T["inputSchema"]>;
export type PluginOutput<T extends PhotonPlugin<any, any, any, any, any>> = zInfer<
    T["outputSchema"]
>;
export type PluginMethods<T extends PhotonPlugin<any, any, any, any, any>> = ReturnType<
    T["install"]
>;
