import { sendAction } from "../actions";
import type { SomeExtension } from "../core/some-extension.ts";
import { everyMessageModifier, onboardModifier } from "../modifiers";
import { compiledPhotonSchema } from "../types";

export const defaultExtensions = {
    modifiers: {
        onboard: onboardModifier,
        everyMessage: everyMessageModifier,
    },
    actions: {
        send: sendAction,
    },
    photonType: compiledPhotonSchema,
} satisfies SomeExtension;
