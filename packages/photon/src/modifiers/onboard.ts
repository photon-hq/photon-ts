import type {
  SomeBaseModifier,
  SomeModifier,
  SomeUniqueBaseModifier,
} from "./some-modifier.ts";
import type { WithoutKey } from "../types";

export type InPhoton = WithoutKey<"onboard">;
type OutPhoton = { onboard: { flow: [] } };

export function onboardModifier(): SomeUniqueBaseModifier<
  InPhoton,
  OutPhoton,
  "onboard"
> {
  return {
    unique: true,
    base: "onboard",

    main(app) {
      (app as any).photon = { ...(app as any).photon, onboard: { flow: [] } };
      return app as any;
    },
  };
}
