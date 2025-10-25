import type { ZodType, z } from "zod";
import { aware } from "../utils";
import type { Context } from "./context";

export type StatesMap = Record<string, Record<string, any>>; // scope_name: { key : value }

export type State<T, maybeUndef extends boolean> = (maybeUndef extends true
    ? (T | undefined) & {
          default(value: T): State<T, false>; // set default value
      }
    : T) & {
    update(value: T): void; // update value
};

export function state<T extends ZodType>(key: string, schema: T): State<z.infer<T>, true> {
    return aware((context) => {
        let currentValue = getState(context, key) as z.infer<T> | undefined;

        const base = {
            update(value: z.infer<T>) {
                const parsed = schema.parse(value);
                currentValue = parsed;
                context.states[context.scopeName] = {
                    ...(context.states[context.scopeName] ?? {}),
                    [key]: parsed,
                };
            },
            default(value: z.infer<T>) {
                if (currentValue === undefined) {
                    const parsed = schema.parse(value);
                    currentValue = parsed;
                }
                return proxy as unknown as State<z.infer<T>, false>;
            },
        };

        const proxy = new Proxy({} as any, {
            get(_t, prop, receiver) {
                // Handle our custom methods
                if (prop === "update" || prop === "default") {
                    return Reflect.get(base, prop, receiver);
                }

                // Primitive-like conversion (string, number, boolean)
                if (prop === Symbol.toPrimitive) {
                    return (hint: string) => {
                        if (currentValue == null) return "";
                        if (typeof currentValue === "object") return JSON.stringify(currentValue);
                        if (hint === "number") return Number(currentValue);
                        return String(currentValue);
                    };
                }

                // Return current value properties/methods
                if (currentValue == null) return undefined;

                const wrapper = Object(currentValue);
                const member = (wrapper as any)[prop];
                return typeof member === "function" ? member.bind(wrapper) : member;
            },

            set(_t, prop, value) {
                if (prop === "update" || prop === "default") return false;
                if (typeof currentValue === "object" && currentValue !== null) {
                    (currentValue as any)[prop] = value;
                    context.states[context.scopeName] = {
                        ...(context.states[context.scopeName] ?? {}),
                        [key]: currentValue,
                    };
                    return true;
                }
                return false;
            },

            ownKeys() {
                // Don’t show update/default in Object.keys()
                const keys = currentValue ? Reflect.ownKeys(Object(currentValue)) : [];
                return keys;
            },

            getOwnPropertyDescriptor(_t, prop) {
                if (prop === "update" || prop === "default") return undefined;
                const wrapper = Object(currentValue);
                return Object.getOwnPropertyDescriptor(wrapper, prop);
            },
        });

        // Mark helpers as non-enumerable so they don’t appear in JSON/stringify
        Object.defineProperties(proxy, {
            update: { value: base.update, enumerable: false },
            default: { value: base.default, enumerable: false },
        });

        return proxy as State<z.infer<T>, true>;
    });
}

function getState(context: Context, key: string): any | undefined {
    const states = context.states[context.scopeName] ?? {};
    return (states[key] as any) ?? undefined;
}
