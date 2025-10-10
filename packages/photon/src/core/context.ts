import type { ActionsOf, SomeExtension } from "../extensions";
import type { Gateway } from "../gateway/server.ts";
import type { App } from "./app.ts";
import type { ActionReturnOf, SomeAction } from "./some-action.ts";

export type Context<Ext extends SomeExtension> = {
    _app: App<any, any, any, Ext>;
    gateway: Gateway;
    user: {
        id: string;
    };
} & {
    [K in keyof ActionsOf<Ext>]: ReturnType<ActionsOf<Ext>[K]> extends infer M
        ? M extends SomeAction<any>
            ? (...args: Parameters<ActionsOf<Ext>[K]>) => ActionReturnOf<M>
            : never
        : never;
};
