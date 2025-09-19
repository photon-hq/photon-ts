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

export type ModIn<M>  = M extends SomeModifier<infer I, any> ? I : never;
export type ModOut<M> = M extends SomeModifier<any, infer O> ? O : never;

export type BaseModIn<M>  = M extends SomeBaseModifier<infer I, any, any> ? I : never;
export type BaseModOut<M> = M extends SomeBaseModifier<any, infer O, any> ? O : never;
export type BaseOf<M>     = M extends SomeBaseModifier<any, any, infer B> ? B : never;

export const BasePhoton: unique symbol = Symbol('base');
export type WithBase<B extends string> = { [BasePhoton]: B };

export const UniquePhoton: unique symbol = Symbol('unique');
export type UniqueOf<P> = P extends { [UniquePhoton]: infer U } ? U : {};
export type WithUnique<U extends {}> = { [UniquePhoton]: U };
// return-photon builder that conditionally accumulates unique
export type ReturnPhoton<P, M, U extends boolean> =
    Merge<
        Merge<P, BaseModOut<M>>,
        Merge<
            WithBase<BaseOf<M>>,
            U extends true
                ? WithUnique<Merge<UniqueOf<P>, BaseModIn<M>>>
                : {}
        >
    >;
