import type { SomeBaseModifier, SomeModifier, SomeUniqueBaseModifier } from "../../core/modifier.ts";
import { onboardModifier } from "../onboard.ts";
import { sendModifier } from "../send.ts";
import { promptModifier } from "../prompt.ts";

export type NormalEntry<Args extends any[] = any[], M extends SomeModifier<any, any> = SomeModifier<any, any>> = {
    readonly mode: "modifier";
    readonly create: (...args: Args) => M;
};

export type BaseEntry<
    M extends SomeBaseModifier<any, any, any> | SomeUniqueBaseModifier<any, any, any> =
        | SomeBaseModifier<any, any, any>
        | SomeUniqueBaseModifier<any, any, any>,
> = {
    readonly mode: "base";
    readonly create: () => M;
};

export type Registry = Record<string, NormalEntry<any[], SomeModifier<any, any>> | BaseEntry<any>>;

export const registry = {
    onboard: {
        mode: "base",
        create: () => onboardModifier(),
    },
    send: {
        mode: "modifier",
        create: (content: string) => sendModifier(content),
    },
    prompt: {
        mode: "modifier",
        create: (content: string) => promptModifier(content),
    },
} as const satisfies Registry;
