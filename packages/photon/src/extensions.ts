import type { SomeModifier, SomeBaseModifier, SomeUniqueBaseModifier } from "./core/modifier.ts";
import { onboardModifier } from "./modifiers/onboard.ts";
import { sendModifier } from "./modifiers/send.ts";

export type SomeExtension = {
    modifiers: Record<
        string,
        (
            ...args: any[]
        ) => SomeModifier<any, any> | SomeBaseModifier<any, any, any> | SomeUniqueBaseModifier<any, any, any>
    >;
};

export const defaultExtensions = {
    onboard: () => onboardModifier(),
    send: (content: string) => sendModifier(content),
} as const;
