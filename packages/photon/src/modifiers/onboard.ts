import merge from "deepmerge";
import type { SomeUniqueModifier } from "../core/some-modifier.ts";
import type { WithoutKey } from "../types";
import type { Merge } from "type-fest";

type InPhoton = WithoutKey<"onboard">;
type OutPhoton = { onboard: { flow: [] } };

export function onboardModifier(action: (context: any) => void): SomeUniqueModifier<InPhoton, OutPhoton> {
    return {
        unique: true,
        main(app) {
            const newPhoton = merge(app.photon, { onboard: { action, flow: [] } });
            (app as any).photon = newPhoton;
            return app as any;
        },
    };
}
