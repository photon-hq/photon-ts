import type { SomeModifier } from "./some-modifier.ts";
import { type BaseOf, BasePhoton } from "../types";

export type SendInPhoton = {
    [BasePhoton]: "onboard";
};

type OutPhoton<P extends SendInPhoton> = BaseOf<P> extends "onboard"
    ? P extends { onboard: { flow: infer F } }
        ? F extends readonly string[]
            ? { onboard: { flow: [...F, "send"] } }
            : { onboard: { flow: ["send"] } }
        : { onboard: { flow: ["send"] } }
    : BaseOf<P> extends "tool"
    ? { tool: [] }
    : never;

type OutFn = <P extends SendInPhoton>(p: P) => OutPhoton<P>;

export function sendModifier(content: string): SomeModifier<SendInPhoton, OutFn> {
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
