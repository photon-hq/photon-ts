import type { SomeModifier } from "../core/modifier.ts";
import { type BaseOf, BasePhoton } from "../types";

type InPhoton = {
    [BasePhoton]: "onboard";
};

type OutPhoton<P extends InPhoton> = BaseOf<P> extends "onboard"
    ? P extends { onboard: { flow: infer F } }
        ? F extends readonly string[]
            ? { onboard: { flow: [...F, "send"] } }
            : { onboard: { flow: ["send"] } }
        : { onboard: { flow: ["send"] } }
    : BaseOf<P> extends "tool"
      ? { tool: [] }
      : never;

type OutFn = <P extends InPhoton>(p: P) => OutPhoton<P>;

export function sendModifier(content: string): SomeModifier<InPhoton, OutFn> {
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
