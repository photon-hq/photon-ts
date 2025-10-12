import merge from "deepmerge";
import type { Merge, Promisable } from "type-fest";
import type { SomeUniqueModifier } from "../core/some-modifier.ts";
import type { PreAction, WithoutKey } from "../types";

type InPhoton = { preActions?: WithoutKey<"onboard"> };
type OutPhoton = { preActions: { onboard: PreAction } };

export function onboardModifier(action: (context: any) => Promisable<void>): SomeUniqueModifier<InPhoton, OutPhoton> {
    return {
        unique: true,
        main(app) {
            (app.photon as any) = merge(app.photon, { preActions: { onboard: { args: [], invokable: "onboard" } } } as OutPhoton);
            app.invokable("onboard", async (context) => {
                await action(context);
            });
            return app as any;
        },
    };
}
