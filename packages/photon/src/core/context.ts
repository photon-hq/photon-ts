import type { SomeExtension } from "../extension";
import type { Gateway } from "../gateway/server.ts";
import type { App } from "./app.ts";

export type Context<Ext extends SomeExtension> = {
    _app: App<any, any, any, Ext>;
    gateway: Gateway;
    user: {
        id: string;
    };
};
