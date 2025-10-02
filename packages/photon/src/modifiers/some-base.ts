import type { Merge } from "type-fest";
import { App } from "../app.ts";

export interface SomeBase<In extends {}, Out extends {}, Base extends string> {
    base: Base;

    main<Name extends string, Description extends string, P extends In>(
        app: App<Name, Description, P>,
    ): App<Name, Description, Merge<P, Out>>;
}

export interface SomeUniqueBase<In extends {}, Out extends {}, Base extends string> extends SomeBase<In, Out, Base> {
    unique: true;
}

type AnyBase<In extends {}, Out extends {}, Base extends string> =
    | SomeBase<In, Out, Base>
    | SomeUniqueBase<In, Out, Base>;

export type BaseModIn<M> = M extends AnyBase<infer I, any, any> ? I : never;
export type BaseModOut<M> = M extends AnyBase<any, infer O, any> ? O : never;
export type BaseModOf<M> = M extends AnyBase<any, any, infer B> ? B : never;
