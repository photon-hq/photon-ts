import type { ActionsOf, SomeExtension } from "../extensions";
import type { Gateway } from "../gateway/server.ts";
import type { App } from "./app.ts";

export type Context<Ext extends SomeExtension> = {
    _app: App<any, any, any, Ext>;
    gateway: Gateway;
    user: {
        id: string;
    };
} & {
    [K in keyof ActionsOf<Ext>]: ReturnType<ActionsOf<Ext>[K]> extends infer M
        ? M extends { Action: infer T }
            ? (...args: Parameters<ActionsOf<Ext>[K]>) => T
            : never
        : never;
};
