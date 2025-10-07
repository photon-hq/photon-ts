import merge from "deepmerge";
import type { SomeUniqueModifier } from "../core/some-modifier.ts";
import type { Promisable, WithoutKey } from "../types";

type InPhoton = WithoutKey<"onboard">;
type OutPhoton = { onboard: {} };

export function onboardModifier(action: () => Promisable<void> = () => {}): SomeUniqueModifier<InPhoton, OutPhoton> {
    return {
        unique: true,

        main(app) {
            (app as any).photon = merge(app.photon, { onboard: { action: action } });
            return app as any;
        },
    };
}
