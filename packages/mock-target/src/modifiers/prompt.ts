import type { SomeModifier } from "photon";

type InPhoton = {};

type OutPhoton<P extends InPhoton> = BaseOf<P> extends "onboard"
    ? { [BasePhoton]: "onboard"; onboard: { flow: [{ type: "send"; content: string }] } }
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
