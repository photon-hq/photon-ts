import {App} from "../app.ts";
import type {Merge} from "type-fest";

export interface SomeModifier<In extends {}, Out extends {}> {
    main<Name extends string, Description extends string, P extends In>(
        app: App<Name, Description, P>
    ): App<Name, Description, Merge<P, Out>>;
}

export interface SomeBaseModifier<In extends {}, Out extends {}, Base extends string> {
    base: Base;

    main<Name extends string, Description extends string, P extends In>(
        app: App<Name, Description, P>
    ): App<Name, Description, Merge<P, Out>>;
}

export interface SomeUniqueBaseModifier<In extends {}, Out extends {}, Base extends string> extends SomeBaseModifier<In, Out, Base> {
    unique: true;
}

export type ModIn<M>  = M extends SomeModifier<infer I, any> ? I : never;
export type ModOut<M> = M extends SomeModifier<any, infer O> ? O : never;

type AnyBaseModifier<In extends {}, Out extends {}, Base extends string> =
    | SomeBaseModifier<In, Out, Base>
    | SomeUniqueBaseModifier<In, Out, Base>;


export type BaseModIn<M>  = M extends AnyBaseModifier<infer I, any, any> ? I : never;
export type BaseModOut<M> = M extends AnyBaseModifier<any, infer O, any> ? O : never;
export type BaseOf<M>     = M extends AnyBaseModifier<any, any, infer B> ? B : never;