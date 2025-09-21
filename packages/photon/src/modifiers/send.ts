import type {ModOut, SomeModifier} from "./some-modifier.ts";
import {type BaseOf, BasePhoton} from "../types";
import {App} from "../app.ts";
import type {Merge} from "type-fest";

type InPhoton = {
    [BasePhoton]: 'onboard'
}

type OutPhoton<P extends InPhoton> =
    BaseOf<P> extends 'onboard'
        ? P extends { onboard: { flow: infer F } }
            ? F extends readonly string[]
                ? { onboard: { flow: [...F, 'send'] } }
                : { onboard: { flow: ['send'] } }
            : { onboard: { flow: ['send'] } }
        : BaseOf<P> extends 'tool'
            ? { tool: [] }
            : never

type OutFn = <P extends InPhoton>(p: P) => OutPhoton<P>;


export const sendModifier: SomeModifier<InPhoton, OutFn> = {
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
        send(
            this: Photon extends InPhoton ? App<Name, Description, Photon> : never
        ): App<Name, Description, Merge<Photon, ModOut<typeof sendModifier, Photon>>>;
    }
}

App.prototype.send = function <
    Name extends string,
    Description extends string,
    Photon extends {} = {}
>(
    this: Photon extends InPhoton ? App<Name, Description, Photon> : never
): App<Name, Description, Merge<Photon, ModOut<typeof sendModifier, Photon>>> {
    return this.modifier(sendModifier) as any
};

const app = new App('test', 'test');
const c = app.onboard().send()