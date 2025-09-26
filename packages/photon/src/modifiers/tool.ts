import merge from "deepmerge";
import type { NonEmptyString } from "type-fest";
import { App } from "../app.ts";
import type { ReturnTypeWithArg, ReturnWithUnique } from "../types";
import { onboardModifier } from "./onboard.ts";
import type { SomeUniqueBaseModifier } from "./some-modifier.ts";

type ToolKey<ToolDescription extends string> = `tool+${ToolDescription}`;

export type InPhoton<ToolDescription extends string> = {
    tools?: Record<string, unknown> & {
        [K in ToolKey<ToolDescription>]?: never;
    };
};

type OutPhoton<ToolDescription extends string> = {
    tools: {
        [K in ToolKey<ToolDescription>]: {
            flow: [];
        };
    };
};

export function toolModifier<ToolDescription extends string>(
    description: NonEmptyString<ToolDescription>,
): SomeUniqueBaseModifier<InPhoton<ToolDescription>, OutPhoton<ToolDescription>, ToolKey<ToolDescription>> {
    return {
        unique: true,
        base: `tool+${description}`,

        main(app) {
            (app as any).photon = merge(app.photon, {
                tools: {
                    [this.base]: {
                        description: description,
                        flow: [],
                    },
                },
            });
            return app as any;
        },
    };
}

type ToolReturn<D extends string> = SomeUniqueBaseModifier<InPhoton<D>, OutPhoton<D>, `tool+${D}`>;

declare module "../app.ts" {
    interface App<Name extends string, Description extends string, Photon extends {} = {}> {
        tool<ToolDescription extends string>(
            this: Photon extends InPhoton<ToolDescription> ? App<Name, Description, Photon> : never,
            description: NonEmptyString<ToolDescription>,
        ): App<Name, Description, ReturnWithUnique<Photon, ToolReturn<ToolDescription>>>;
    }
}

App.prototype.tool = function <
    ToolDescription extends string,
    Name extends string,
    Description extends string,
    Photon extends {} = {},
>(
    this: Photon extends InPhoton<ToolDescription> ? App<Name, Description, Photon> : never,
    description: NonEmptyString<ToolDescription>,
): App<Name, Description, ReturnWithUnique<Photon, ToolReturn<ToolDescription>>> {
    return this.baseModifier(toolModifier(description)) as any;
};

export {};
