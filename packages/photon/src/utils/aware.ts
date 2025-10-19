import { AsyncLocalStorage } from "node:async_hooks";
import type { Context } from "../core/context";

const als = new AsyncLocalStorage<Context>();

export function aware(context: Context, handler: (context: Context) => void): void
export function aware<T>(handler: (context: Context) => T): T
export function aware(context: Context | ((context: Context) => any), handler?: (context: Context) => any): void {
    if (typeof context === 'function') {
        handler = context;
        context = null as any;
    }

    if (context && handler) {
        als.run(context as Context, () => {
            handler!(context as Context);
        })

        return
    }

    const als_context = als.getStore();

    if (als_context && handler) {
        return handler(als_context);
    }

    throw new Error("No context available");
}