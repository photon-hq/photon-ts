import { sendAction } from "../actions/send.ts";
import { onboardModifier } from "../modifiers";
import { compiledPhotonSchema } from "../types";
import type { SomeExtension } from "../core/some-extension.ts";

export const defaultExtensions = {
    actions: {
        send: sendAction,
    },
    photonType: compiledPhotonSchema,
} satisfies SomeExtension;