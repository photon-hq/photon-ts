import type { SomeExtension } from "../extension";

export * from "./onboard.ts";

import { compiledPhotonSchema } from "../types";
import { onboardModifier } from "./onboard.ts";

export const defaultExtensions = {
    modifiers: {
        onboard: onboardModifier,
    },
    photonType: compiledPhotonSchema,
} satisfies SomeExtension;
