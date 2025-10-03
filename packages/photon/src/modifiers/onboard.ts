import merge from "deepmerge";
import { App } from "../app.ts";
import type { IsUnique, Promisable, ReturnWithUnique, WithoutKey } from "../types";
import type { SomeUniqueModifier } from "./some-modifier.ts";

type InPhoton = WithoutKey<"onboard">;
type OutPhoton = { onboard: {} };

export function onboardModifier(action: () => Promisable<void>): SomeUniqueModifier<InPhoton, OutPhoton, "onboard"> {
    return {
        unique: true,

        main(app) {
            (app as any).photon = merge(app.photon, { onboard: { action: action } });
            return app as any;
        },
    };
}

declare module "../app.ts" {
    interface App<Name extends string, Description extends string, Photon extends {} = {}> {
        onboard(
            this: Photon extends InPhoton ? App<Name, Description, Photon> : never,
            action: () => Promisable<void>,
        ): App<Name, Description, ReturnWithUnique<Photon, ReturnType<typeof onboardModifier>>>;
    }
}

App.prototype.onboard = function <Name extends string, Description extends string, Photon extends {} = {}>(
    this: Photon extends InPhoton ? App<Name, Description, Photon> : never,
    action: () => Promisable<void>,
): App<Name, Description, ReturnWithUnique<Photon, ReturnType<typeof onboardModifier>>> {
    return this.modifier(onboardModifier(action)) as any;
};

export {};
