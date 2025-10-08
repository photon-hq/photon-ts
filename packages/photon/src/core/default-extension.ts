import { sendAction } from "../actions/send.ts";
import type { SomeExtension } from "../extension";
import { onboardModifier } from "../modifiers";
import { compiledPhotonSchema } from "../types";

export const defaultExtensions = {
    modifiers: {
        onboard: onboardModifier,
    },
    actions: {
        send: sendAction,
    },
    photonType: compiledPhotonSchema,
} satisfies SomeExtension;
