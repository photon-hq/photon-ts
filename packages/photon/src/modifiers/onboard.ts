import merge from "deepmerge";
import type { Merge, Promisable } from "type-fest";
import type { SomeUniqueModifier } from "../core/some-modifier.ts";
import type { WithoutKey } from "../types";

type InPhoton = WithoutKey<"onboard">;
type OutPhoton = { onboard: {} };

export function onboardModifier(action: (context: any) => Promisable<void>): SomeUniqueModifier<InPhoton, OutPhoton> {
    return {
        unique: true,
        main(app) {
            app.photon = merge(app.photon, { onboard: {} });
            app.invokable("onboard", async (context) => {
                await action(context);
            });
            return app as any;
        },
    };
}
