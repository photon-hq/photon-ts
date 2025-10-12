import merge from "deepmerge";
import type { Merge, Promisable } from "type-fest";
import type { App, Context, ModifierReturn, SomeUniqueModifier } from "../core";
import type { SomeExtension } from "../core/some-extension.ts";
import type { PreAction, WithoutKey } from "../types";
import type { MessageContent } from "../gateway/types/message.ts";

type InPhoton = {};
type OutPhoton = { preActions: { everyMessage: PreAction } };

export function everyMessageModifier(action: (context: any) => Promisable<void>): SomeUniqueModifier<InPhoton, OutPhoton> {
    return {
        unique: true,
        main(app) {
            (app.photon as any) = merge(app.photon, {
                preActions: { everyMessage: { args: [], invokable: "everyMessage" } },
            } as OutPhoton);
            
            app.invokable("everyMessage", async (context) => {
                await action(context);
                return (context as any).messages
            });
            
            return app as any;
        },
    };
}

export type EveryMessageRegistry<A extends App<any, any>, E extends SomeExtension> = (
    action: (context: Context<E> & { messages: MessageContent[] }) => void,
) => ModifierReturn<typeof everyMessageModifier, A>;
