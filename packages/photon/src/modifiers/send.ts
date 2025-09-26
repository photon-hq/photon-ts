import type { ModOut, SomeModifier } from "./some-modifier.ts";
import { type BaseOf, BasePhoton } from "../types";
import { App } from "../app.ts";
import type { Merge } from "type-fest";
import "./onboard.ts";

type InPhoton = {
    [BasePhoton]: "onboard";
};

type OutPhoton<P extends InPhoton> =
    BaseOf<P> extends "onboard"
        ? P extends { onboard: { flow: infer F } }
            ? F extends readonly string[]
                ? { onboard: { flow: [...F, "send"] } }
                : { onboard: { flow: ["send"] } }
            : { onboard: { flow: ["send"] } }
        : BaseOf<P> extends "tool"
            ? { tool: [] }
            : never;

type OutFn = <P extends InPhoton>(p: P) => OutPhoton<P>;

function sendModifier(content: string): SomeModifier<InPhoton, OutFn> {
    return {
        main(app) {
            if (app.photon[BasePhoton] === "onboard") {
                (app.photon as any).onboard.flow.push({
                    type: "send",
                    content: content,
                });
            } else if (app.photon[BasePhoton] === "tool") {
            }

            return app as any;
        },
    };
}

declare module "../app.ts" {
    interface App<Name extends string, Description extends string, Photon extends {} = {}> {
        send(
            this: Photon extends InPhoton ? App<Name, Description, Photon> : never,
            content: string,
        ): App<Name, Description, Merge<Photon, ModOut<ReturnType<typeof sendModifier>, Photon>>>;
    }
}

App.prototype.send = function <
    Name extends string,
    Description extends string,
    Photon extends {} = {},
>(
    this: Photon extends InPhoton ? App<Name, Description, Photon> : never,
    content: string,
): App<Name, Description, Merge<Photon, ModOut<ReturnType<typeof sendModifier>, Photon>>> {
    return this.modifier(sendModifier(content)) as any;
};