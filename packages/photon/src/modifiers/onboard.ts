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
            (app as any).photon = merge(app.photon, { onboard: { action, flow: [] } });
            return app as any;
        },
    };
}
