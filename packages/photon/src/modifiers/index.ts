import type {SomeExtension} from "../extension";

export * from "./onboard.ts";
import { onboardModifier } from "./onboard.ts";
import {compiledPhotonSchema} from "../types";

export const defaultExtensions = {
    modifiers: {
        onboard: onboardModifier,
    },
    photonType: compiledPhotonSchema
} satisfies SomeExtension