import merge from "deepmerge";
import type { Promisable } from "type-fest";
import type { App, Context, ModifierReturn, SomeModifier } from "../core";
import type { SomeExtension } from "../core/some-extension.ts";
import type { MessageContent } from "../gateway/types/message.ts";
import type { PreAction, WithoutKey } from "../types";

type InPhoton = { preActions?: Record<string, PreAction> & WithoutKey<"everyMessage"> };
type OutPhoton = { preActions: { everyMessage: PreAction } };

type Options = {
    mode: "break" | "passthrough";
};

const defaultOptions: Options = {
    mode: "passthrough",
};

export function everyMessageModifier(
    action: (context: any) => Promisable<void>,
    options: Options = defaultOptions,
): SomeModifier<InPhoton, OutPhoton> {
    return {
        main(app) {
            (app.photon as any) = merge(app.photon, {
                preActions: { everyMessage: { args: [], invokable: "everyMessage" } },
            } as OutPhoton);

            app.invokable("everyMessage", async (context) => {
                await action(context);
                return (() => {
                    switch (options.mode) {
                        case "break":
                            return [];
                        case "passthrough":
                            return (context as any).messages;
                    }
                })();
            });

            return app as any;
        },
    };
}

export type EveryMessageRegistry<A extends App<any, any, any, any>, E extends SomeExtension> = (
    action: (context: Context<E> & { messages: MessageContent[] }) => void,
    options?: Options,
) => ModifierReturn<typeof everyMessageModifier, A>;
