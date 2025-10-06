import type {SomeExtension} from "../extension";

export * from "./onboard.ts";
import { onboardModifier } from "./onboard.ts";

export const defaultExtensions = {
    modifiers: {
        onboard: onboardModifier,
    }
} satisfies SomeExtension