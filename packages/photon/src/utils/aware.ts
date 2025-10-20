import { AsyncLocalStorage } from "node:async_hooks";
import type { Context } from "../core/context";
import type { Promisable } from "type-fest";

type ContextAwareHandler<T> = (context: Context) => Promisable<T>;

const als = new AsyncLocalStorage<Context>();

export function aware<T>(context: Context, handler: ContextAwareHandler<T>): Promisable<T>;
export function aware<T>(handler: ContextAwareHandler<T>): Promisable<T>;
export function aware<T>(
    contextOrHandler: Context | ContextAwareHandler<T>,
    maybeHandler?: ContextAwareHandler<T>,
): Promisable<T> {
    const handler: ContextAwareHandler<T> =
        typeof contextOrHandler === "function" ? (contextOrHandler as ContextAwareHandler<T>) : (maybeHandler as ContextAwareHandler<T>);

    if (!handler) {
        throw new Error("No handler provided");
    }

    if (typeof contextOrHandler !== "function") {
        const context = contextOrHandler;
        if (!context) {
            throw new Error("No context available");
        }

        return als.run(context, () => handler(context));
    }

    const context = als.getStore();
    if (!context) {
        throw new Error("No context available");
    }

    return handler(context);
}
