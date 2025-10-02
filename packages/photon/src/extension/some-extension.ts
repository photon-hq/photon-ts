import type {
    BaseModIn,
    ModIn,
    ModOut,
    SomeBaseModifier,
    SomeModifier,
    SomeUniqueBaseModifier
} from "../core/modifier.ts";
import type {DeepMerge, ReturnWithUnique} from "../types";
import type {Merge} from "type-fest";
import type {App} from "../core/app.ts";

export interface SomeExtension {
    modifiers: Record<string, (...args: any[]) => SomeModifier<any, any> | SomeBaseModifier<any, any, any>>
}

export type ModifiersOf<T extends SomeExtension> = T['modifiers'];

export type ExtensionBuilder<N extends string, D extends string, P extends {}, Ext extends SomeExtension> = {
    [K in keyof ModifiersOf<Ext>]: (
        ...args: Parameters<ModifiersOf<Ext>[K]>
    ) => ReturnType<ModifiersOf<Ext>[K]> extends infer M
        ? M extends SomeBaseModifier<any, any, any>
            ? P extends BaseModIn<M>
                ? App<N, D, ReturnWithUnique<P, M>, Ext> & ExtensionBuilder<N, D, ReturnWithUnique<P, M>, Ext>
                : never
            : M extends SomeModifier<any, any>
                ? P extends ModIn<M>
                    ? App<N, D, Merge<P, ModOut<M, P>>, Ext> & ExtensionBuilder<N, D, ModOut<M, P>, Ext>
                    : never
                : never
        : never
}