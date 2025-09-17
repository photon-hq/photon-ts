import type {SomeModifier} from "./some-modifier.ts";
import type {WithoutKey} from "../magictype";
import type {Merge} from "type-fest";
import {App} from "../app.ts";

type InPhoton = WithoutKey<'onboard'>
type OutPhoton = {onboard: {}}

export const onboardModifier: SomeModifier<InPhoton, OutPhoton> = {
    main(app) {
        (app as any).photon = { ...(app as any).photon, onboard: {} };
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
        ): App<Name, Description, Merge<Photon, OutPhoton>>;
    }
}

App.prototype.onboard = function <
    Name extends string,
    Description extends string,
    Photon extends {} = {}
>(
    this: Photon extends InPhoton ? App<Name, Description, Photon> : never
): App<Name, Description, Merge<Photon, OutPhoton>> {
    return this.use(onboardModifier) as unknown as App<Name, Description, Merge<Photon, OutPhoton>>
};

export {};