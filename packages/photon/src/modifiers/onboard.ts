import type {SomeBaseModifier, SomeModifier, SomeUniqueBaseModifier} from "./some-modifier.ts";
import type {ReturnWithUnique, WithoutKey} from "../types";
import {App} from "../app.ts";

type InPhoton = WithoutKey<'onboard'>
type OutPhoton = {onboard: {flow: []}}

export const onboardModifier: SomeUniqueBaseModifier<InPhoton, OutPhoton, "onboard"> = {
    unique: true,
    base: "onboard",

    main(app) {
        (app as any).photon = { ...(app as any).photon, onboard: {flow: []} };
        return app as any;
    }
};


declare module "../app.ts" {
    interface App<
        Name extends string,
        Description extends string,
        Photon extends {} = {}
    > {
        onboard(
            this: Photon extends InPhoton ? App<Name, Description, Photon> : never
        ): App<Name, Description, ReturnWithUnique<Photon, typeof onboardModifier>>;
    }
}

App.prototype.onboard = function <
    Name extends string,
    Description extends string,
    Photon extends {} = {}
>(
    this: Photon extends InPhoton ? App<Name, Description, Photon> : never
): App<Name, Description, ReturnWithUnique<Photon, typeof onboardModifier>> {
    return this.baseModifier(onboardModifier) as any
};

export {};