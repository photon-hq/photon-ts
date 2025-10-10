import merge from "deepmerge";
import type { AppInstance } from "../core/app-instance.ts";
import type { SomeUniqueModifier } from "../core/some-modifier.ts";
import type { Promisable, WithoutKey } from "../types";
import type { Merge } from "type-fest";

type InPhoton = WithoutKey<"onboard">;
type OutPhoton = { onboard: { action: () => Promisable<void>; flow: [] } };

export function onboardModifier(action: () => Promisable<void> = () => {}): SomeUniqueModifier<InPhoton, OutPhoton> {
    return {
        unique: true,
        main(app) {
            const newPhoton = merge(app.photon, { onboard: { action, flow: [] } });
            (app as any).photon = newPhoton;
            return app as any;
        },
    };
}
