import type { ReturnWithUnique, WithoutKey, BasePhoton } from "../types";
import type { ModOut } from "./some-modifier";
import type { Merge } from "type-fest";
import { App } from "../app.ts";
import { onboardModifier } from "./onboard.ts";
import { sendModifier } from "./send.ts";
import type { InPhoton as InPhotonOnboard } from "./onboard.ts";
import type { InPhoton as InPhotonSend } from "./send.ts";

declare module "../app.ts" {
  interface App<
    Name extends string,
    Description extends string,
    Photon extends {} = {}
  > {
    onboard(
      this: Photon extends InPhotonOnboard
        ? App<Name, Description, Photon>
        : never
    ): App<Name, Description, ReturnWithUnique<Photon, typeof onboardModifier>>;
    send(
      this: Photon extends InPhotonSend
        ? App<Name, Description, Photon>
        : never,
      content: string
    ): App<
      Name,
      Description,
      Merge<Photon, ModOut<typeof sendModifier, Photon>>
    >;
  }
}

App.prototype.onboard = function <
  Name extends string,
  Description extends string,
  Photon extends {} = {}
>(
  this: Photon extends InPhotonOnboard ? App<Name, Description, Photon> : never
): App<Name, Description, ReturnWithUnique<Photon, typeof onboardModifier>> {
  return this.baseModifier(onboardModifier()) as any;
};

App.prototype.send = function <
  Name extends string,
  Description extends string,
  Photon extends {} = {}
>(
  this: Photon extends InPhotonSend ? App<Name, Description, Photon> : never,
  content: string
): App<Name, Description, Merge<Photon, ModOut<typeof sendModifier, Photon>>> {
  return this.modifier(sendModifier(content)) as any;
};
