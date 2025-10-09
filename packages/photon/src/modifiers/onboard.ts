import merge from "deepmerge";
import type { App } from "../core/app.ts";
import type { AppInstance } from "../core/app-instance.ts";
import type { defaultExtensions } from "../extensions";
import type { SomeUniqueModifier } from "../core/some-modifier.ts";
import type { Promisable, WithoutKey } from "../types";
import type { Merge } from "type-fest";

type InPhoton = WithoutKey<"onboard">;
type OutPhoton = { onboard: {} };

export function onboardModifier(action: () => Promisable<void> = () => {}): SomeUniqueModifier<InPhoton, OutPhoton> {
    return {
        unique: true,

        main<Name extends string, Description extends string, P extends InPhoton, Ext extends typeof defaultExtensions>(
            app: App<Name, Description, P, Ext>,
        ): AppInstance<Name, Description, Merge<P, OutPhoton>> {
            (app as any).photon = merge((app as any).photon, { onboard: { action: action } });
            return app as any;
        },
    };
}
