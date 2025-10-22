import { AsyncLocalStorage } from "node:async_hooks";
import type { Context } from "../core/context";

const als = new AsyncLocalStorage<Context>();

// root, inject context
export function aware<T>(context: Context, handler: () => Promise<T>): Promise<T>;
export function aware<T>(context: Context, handler: () => T): T;
// sub, get context from async local storage
export function aware<T>(handler: (context: Context) => Promise<T>): Promise<T>;
export function aware<T>(handler: (context: Context) => T): T;

export function aware(
    contextOrHandler: Context | ((context: Context) => any),
    maybeHandler?: () => any,
): any {
    const handler =
        typeof contextOrHandler === "function"
            ? (contextOrHandler as (context: Context) => any)
            : (maybeHandler as (context: Context) => any);

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

/**
 * Get current context from AsyncLocalStorage
 * Must be called within an aware() scope
 */
export function getContext(): Context {
    const context = als.getStore();
    if (!context) {
        throw new Error("No context available. Must be called within aware() scope.");
    }
    return context;
}
