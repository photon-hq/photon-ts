import type { SomeUniqueBaseModifier } from "./some-modifier.ts";
import type { WithoutKey } from "../types";
import merge from "deepmerge";

export type OnboardInPhoton = WithoutKey<"onboard">;
type OutPhoton = { onboard: { flow: [] } };

export function onboardModifier(): SomeUniqueBaseModifier<OnboardInPhoton, OutPhoton, "onboard"> {
    return {
        unique: true,
        base: "onboard",

        main(app) {
            (app as any).photon = merge(app.photon, { onboard: { flow: [] } });
            return app as any;
        },
    };
}
