import { onboardModifier } from "./modifiers/onboard.ts";
import { sendModifier } from "./modifiers/send.ts";

export const defaultExtensions = {
    onboard: () => onboardModifier(),
    send: (content: string) => sendModifier(content),
} as const;
