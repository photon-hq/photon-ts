import type { SomeModifier } from "photon";
import { type BaseOf, BasePhoton } from "photon";

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
            return app as any;
        },
    };
}
