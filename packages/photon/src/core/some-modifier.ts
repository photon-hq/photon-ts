import type { Merge } from "type-fest";
import type { defaultExtensions, SomeExtension } from "../extensions";
import type { DescriptionOf, ExtensionsOf, NameOf, PhotonOf, ReturnWithUnique } from "../types";
import type { App } from "./app.ts";

export interface SomeModifier<In extends {}, Out extends {}> {
    main<Name extends string, Description extends string, P extends In, E extends SomeExtension>(
        app: App<Name, Description, P, E>,
    ): App<Name, Description, Merge<P, Out>, E>;
}

export interface SomeUniqueModifier<In extends {}, Out extends {}> extends SomeModifier<In, Out> {
    unique: true;
}

export type AnyModifier<In extends {}, Out extends {}> = SomeModifier<In, Out> | SomeUniqueModifier<In, Out>;
export type ModIn<M> = M extends AnyModifier<infer I, any> ? I : never;
export type ModOut<M> = M extends AnyModifier<any, infer O> ? O : never;

export type ModifierReturn<
    M extends (...args: any[]) => AnyModifier<any, any>,
    A extends App<any, any, any, any>,
> = PhotonOf<A> extends ModIn<ReturnType<M>>
    ? App<NameOf<A>, DescriptionOf<A>, ReturnWithUnique<PhotonOf<A>, ReturnType<M>>, ExtensionsOf<A>>
    : never;
