import type { SomeModifier } from "./base.ts";
import { type BaseOf, BasePhoton } from "../types";

type InPhoton = {
    [BasePhoton]: "onboard";
};

type OutPhoton<P extends InPhoton> = BaseOf<P> extends "onboard"
    ? P extends { onboard: { flow: infer F } }
        ? F extends readonly string[]
            ? { onboard: { flow: [...F, "prompt"] } }
            : { onboard: { flow: ["prompt"] } }
        : { onboard: { flow: ["prompt"] } }
    : BaseOf<P> extends "tool"
      ? { tool: [] }
      : never;

type OutFn = <P extends InPhoton>(p: P) => OutPhoton<P>;

export function promptModifier(content: string): SomeModifier<InPhoton, OutFn> {
    return {
        main(app) {
            if (app.photon[BasePhoton] === "onboard") {
                (app.photon as any).onboard.flow.push({
                    type: "prompt",
                    content: content,
                });
            } else if (app.photon[BasePhoton] === "tool") {
            }

            return app as any;
        },
    };
}
