import merge from "deepmerge";
import type { SomeBaseModifier, SomeUniqueBaseModifier } from "../core/some-modifier.ts";
import type { WithoutKey } from "../types";

type InPhoton = WithoutKey<"onboard">;
type OutPhoton = { onboard: { flow: [] } };

export function onboardModifier(): SomeUniqueBaseModifier<InPhoton, OutPhoton, "onboard"> {
    return {
        unique: true,
        base: "onboard",

        main(app) {
            (app as any).photon = merge(app.photon, { onboard: { flow: [] } });
            return app as any;
        },
    };
}
