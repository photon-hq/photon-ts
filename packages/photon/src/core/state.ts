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

export function state<T extends ZodType>(key: string, _type: T): State<z.infer<T>, true> {
    return aware((context) => {
        let currentValue = getState(context, key) as z.infer<T> | undefined;

        const s: State<z.infer<T>, true> = {} as any;

        Object.defineProperties(s, {
            update: {
                value(value: z.infer<T>) {
                    currentValue = value;
                    context.states[context.scopeName] = {
                        ...context.states[context.scopeName],
                        [key]: value,
                    };
                },
            },
            default: {
                value(value: z.infer<T>) {
                    currentValue = value;
                    return s;
                },
            },
        });

        Object.assign(s, currentValue);

        return s;
    });
}

function getState(context: Context, key: string): any | undefined {
    const states = context.states[context.scopeName] ?? {};
    return (states[key] as any) ?? undefined;
}
