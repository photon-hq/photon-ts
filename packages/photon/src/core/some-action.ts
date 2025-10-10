import type { Context } from "./context.ts";
import type { defaultExtensions } from "../extensions";

export interface SomeAction<T> {
    main<Ext extends typeof defaultExtensions>(context: Context<Ext>): Promise<T>;
}

export type ActionReturnOf<A> = A extends SomeAction<infer T> ? T : never;