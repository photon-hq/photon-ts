import type { Merge, NonEmptyString } from "type-fest";

import { App } from "./core/app.ts";
import type { BaseModIn, ModIn, ModOut, SomeBaseModifier, SomeModifier } from "./core/some-modifier.ts";
import type { ReturnWithUnique } from "./types";

export type ExtendedApp<
    Name extends string,
    Description extends string,
    P extends object,
    Exts extends Record<string, (...args: any[]) => SomeModifier<any, any> | SomeBaseModifier<any, any, any>>,
> = {
    deploy: App<Name, Description, P>["deploy"];
    unwrap: () => App<Name, Description, P>;
} & {
    [K in keyof Exts]: (
        ...args: Parameters<Exts[K]>
    ) => ReturnType<Exts[K]> extends infer M
        ? M extends SomeBaseModifier<any, any, any>
            ? P extends BaseModIn<M>
                ? ExtendedApp<Name, Description, ReturnWithUnique<P, M>, Exts>
                : never
            : M extends SomeModifier<any, any>
              ? P extends ModIn<M>
                  ? ExtendedApp<Name, Description, Merge<P, ModOut<M, P>>, Exts>
                  : never
              : never
        : never;
};

export function createApp<
    Name extends string,
    Description extends string,
    Exts extends Record<string, (...args: any[]) => SomeModifier<any, any> | SomeBaseModifier<any, any, any>>,
>(options: {
    name: NonEmptyString<Name>;
    description: NonEmptyString<Description>;
    extensions: Exts;
}): ExtendedApp<Name, Description, Record<string, never>, Exts> {
    const app = new App<Name, Description>(options.name, options.description);

    const buildExtendedApi = (currentApp: App<Name, Description, any>): ExtendedApp<Name, Description, any, Exts> => {
        const api = {
            deploy: currentApp.deploy.bind(currentApp),
            unwrap: () => currentApp,
        } as ExtendedApp<Name, Description, any, Exts>;

        for (const [key, modifierFactory] of Object.entries(options.extensions)) {
            (api as any)[key] = (...args: any[]) => {
                const modifier = modifierFactory(...args);

                let newApp: App<Name, Description, any>;
                if ("base" in modifier) {
                    newApp = currentApp.baseModifier(modifier as SomeBaseModifier<any, any, any>);
                } else {
                    newApp = currentApp.modifier(modifier as SomeModifier<any, any>);
                }

                return buildExtendedApi(newApp);
            };
        }

        return api;
    };

    return buildExtendedApi(app);
}
