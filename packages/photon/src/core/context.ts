import type { ActionsOf, SomeExtension } from "../extension";
import type { Gateway } from "../gateway/server.ts";
import type { App } from "./app.ts";
import type { ActionOf, SomeAction } from "./some-action.ts";

export type Context<Ext extends SomeExtension> = {
    _app: App<any, any, any, Ext>;
    gateway: Gateway;
    user: {
        id: string;
    };
} & {
    [K in keyof ActionsOf<Ext>]: ReturnType<ActionsOf<Ext>[K]> extends infer M
        ? M extends SomeAction<any>
            ? (...args: Parameters<ActionsOf<Ext>[K]>) => ActionOf<M>
            : never
        : never;
};
