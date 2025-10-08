import type { SomeExtension } from "../extension";
import type { Context } from "./context.ts";
import type { defaultExtensions } from "./default-extension.ts";

export interface SomeAction<T> {
    main<Ext extends SomeExtension = typeof defaultExtensions>(context: Context<Ext>): Promise<T>;
}
