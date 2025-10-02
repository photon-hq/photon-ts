import type { Merge, NonEmptyString } from "type-fest";

import { AppInstance, buildExtendedApi, type ExtendedApp, __INTERNAL_CONSTRUCTOR_DO_NOT_USE_ } from "./core/app.ts";
import type { BaseModIn, ModIn, ModOut, SomeBaseModifier, SomeModifier } from "./core/modifier.ts";
import type { ReturnWithUnique } from "./types";

export function createApp<
    Name extends string,
    Description extends string,
    Exts extends Record<string, (...args: any[]) => SomeModifier<any, any> | SomeBaseModifier<any, any, any>>,
>(options: {
    name: NonEmptyString<Name>;
    description: NonEmptyString<Description>;
    extensions: Exts;
}): ExtendedApp<Name, Description, Record<string, never>, Exts> {
    const app = new AppInstance(options.name, options.description, __INTERNAL_CONSTRUCTOR_DO_NOT_USE_);

    return buildExtendedApi(app, options.extensions);
}
