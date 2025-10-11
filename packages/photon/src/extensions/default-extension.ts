import { sendAction } from "../actions";
import type { SomeExtension } from "../core/some-extension.ts";
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
