import type { defaultExtensions } from "../extensions";
import type { Context } from "./context.ts";

export interface SomeAction<T> {
    main<Ext extends typeof defaultExtensions>(context: Context<Ext>): Promise<T>;
}

export type ActionReturnOf<A> = A extends SomeAction<infer T> ? T : never;
