import z from "zod";
import type { Context } from "../core";
import type { defaultExtensions, SomeExtension } from "../extensions";

export const preActionArgs = z.object({
    messages: z.array(z.string().min(1)),
});

export type PreActionArgs = z.infer<typeof preActionArgs>;

export const preActionArgsKeys = z.enum(
    Object.keys(preActionArgs.shape) as [keyof PreActionArgs, ...(keyof PreActionArgs)[]],
);

export type PreActionArgsKeys = z.infer<typeof preActionArgsKeys>;

export const preAction = z.object({
    invokable: z.string(),
    args: z.array(preActionArgsKeys),
});

export type PreAction = z.infer<typeof preAction>;
