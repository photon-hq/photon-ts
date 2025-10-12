import merge from "deepmerge";
import type { Merge, Promisable } from "type-fest";
import type { App, Context, ModifierReturn, SomeUniqueModifier } from "../core";
import type { SomeExtension } from "../core/some-extension.ts";
import type { MessageContent } from "../gateway/types/message.ts";
import type { PreAction, WithoutKey } from "../types";

type InPhoton = { preActions?: WithoutKey<"onboard"> };
type OutPhoton = { preActions: { onboard: PreAction } };

export function onboardModifier(action: (context: any) => Promisable<void>): SomeUniqueModifier<InPhoton, OutPhoton> {
    return {
        unique: true,
        main(app) {
            (app.photon as any) = merge(app.photon, {
                preActions: { onboard: { args: [], invokable: "onboard" } },
            } as OutPhoton);

            app.invokable("onboard", async (context) => {
                await action(context);
                return (context as any).messages;
            });

            return app as any;
        },
    };
}

export type OnboardRegistry<A extends App<any, any>, E extends SomeExtension> = (
    action: (context: Context<E> & { messages: MessageContent[] }) => void,
) => ModifierReturn<typeof onboardModifier, A>;
