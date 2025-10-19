import type { ZodType, z } from "zod";

interface State<T> {
    (): T;
    (value: T): void;
    default(value: T): this;
}

export function state<T extends ZodType>(key: string, type: T): State<z.infer<T>> {
    return null as any
}
