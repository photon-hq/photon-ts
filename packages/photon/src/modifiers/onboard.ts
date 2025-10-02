import merge from "deepmerge";
import { App } from "../app.ts";
import type { IsUnique, ReturnWithUnique, WithoutKey } from "../types";
import type { SomeUniqueBase } from "./some-base.ts";

type InPhoton = WithoutKey<"onboard">;
type OutPhoton = { onboard: { flow: [] } };

export function onboardModifier(action: () => Promise<void>): SomeUniqueBase<InPhoton, OutPhoton, "onboard"> {
    return {
        unique: true,
        base: "onboard",

        main(app) {
            (app as any).photon = merge(app.photon, { onboard: { flow: [] } });
            return app as any;
        },
    };
}

declare module "../app.ts" {
    interface App<Name extends string, Description extends string, Photon extends {} = {}> {
        onboard(
            this: Photon extends InPhoton ? App<Name, Description, Photon> : never,
            action: () => Promise<void>,
        ): App<Name, Description, ReturnWithUnique<Photon, ReturnType<typeof onboardModifier>>>;
    }
}

App.prototype.onboard = function <Name extends string, Description extends string, Photon extends {} = {}>(
    this: Photon extends InPhoton ? App<Name, Description, Photon> : never,
    action: () => Promise<void>,
): App<Name, Description, ReturnWithUnique<Photon, ReturnType<typeof onboardModifier>>> {
    return this.base(onboardModifier(action)) as any;
};

export {};
