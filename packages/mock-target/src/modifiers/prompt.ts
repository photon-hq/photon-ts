import type { SomeModifier } from "photon";
import { type BaseOf, BasePhoton } from "photon";

type InPhoton = {
    [BasePhoton]: "onboard";
};

type OutPhoton<P extends InPhoton> = BaseOf<P> extends "onboard"
    ? { [BasePhoton]: "onboard"; onboard: { flow: [{ type: "send"; content: string }] } }
    : BaseOf<P> extends "tool"
      ? { tool: [] }
      : never;

type OutFn = <P extends InPhoton>(p: P) => OutPhoton<P>;

export function promptModifier(content: string): SomeModifier<InPhoton, OutFn> {
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
