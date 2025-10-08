import type { Context } from "./context.ts";
import type { defaultExtensions } from "./default-extension.ts";

export interface SomeAction<T> {
    main<Ext extends typeof defaultExtensions>(context: Context<Ext>): Promise<T>;
}

export type ActionOf<A> = A extends SomeAction<infer T> ? T : never;
