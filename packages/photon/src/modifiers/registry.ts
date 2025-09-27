import { onboardModifier } from "./onboard.ts";
import { sendModifier } from "./send.ts";

export const registry = {
    onboard: {
        type: "base" as const,
        func: onboardModifier,
    },
    send: {
        type: "modifier" as const,
        func: sendModifier,
    },
};
