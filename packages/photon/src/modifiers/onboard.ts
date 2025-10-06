import merge from "deepmerge";
import type { SomeBaseModifier, SomeUniqueBaseModifier } from "../core/modifier.ts";
import type { WithoutKey } from "../types";

type InPhoton = WithoutKey<"onboard">;
type OutPhoton = { onboard: {} };

export function onboardModifier(action: () => Promisable<void>): SomeUniqueModifier<InPhoton, OutPhoton> {
    return {
        unique: true,

        main(app) {
            (app as any).photon = merge(app.photon, { onboard: { action: action } });
            return app as any;
        },
    };
}
