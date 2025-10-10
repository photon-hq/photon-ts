import type { SomeModifier, SomeUniqueModifier } from "./some-modifier.ts";
import { onboardModifier } from "../modifiers/onboard.ts";
import { promptModifier } from "../modifiers/prompt.ts";
import { sendModifier } from "../modifiers/send.ts";
import type { Promisable } from "../types";

export type NormalEntry<
    Args extends any[] = any[],
    M extends SomeModifier<any, any> | SomeUniqueModifier<any, any> =
        | SomeModifier<any, any>
        | SomeUniqueModifier<any, any>,
> = {
    readonly mode: "modifier";
    readonly create: (...args: Args) => M;
};

export type Registry = Record<string, NormalEntry<any[], SomeModifier<any, any> | SomeUniqueModifier<any, any>>>;

export const registry = {
    onboard: {
        mode: "modifier",
        create: (action?: () => Promisable<void>) => onboardModifier(action),
    },
    prompt: {
        mode: "modifier",
        create: (content: string) => promptModifier(content),
    },
    send: {
        mode: "modifier",
        create: (content: string) => sendModifier(content),
    },
} as const satisfies Registry;
