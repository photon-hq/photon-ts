import type { Merge } from "type-fest";
import type { defaultExtensions, SomeExtension } from "../extensions";
import type { DescriptionOf, ExtensionsOf, NameOf, PhotonOf, ReturnWithUnique } from "../types";
import type { App } from "./app.ts";

export interface SomeModifier<In extends {}, Out extends {}> {
    main(app: App<string, string, any, typeof defaultExtensions>): App<any, any, any, any>;
}

export type ModIn<M> = M extends SomeModifier<infer I, any> ? I : never;
export type ModOut<M> = M extends SomeModifier<any, infer O> ? O : never;

export type ModifierReturn<
    M extends (...args: any[]) => SomeModifier<any, any>,
    A extends App<any, any, any, any>,
> = PhotonOf<A> extends ModIn<ReturnType<M>>
    ? App<NameOf<A>, DescriptionOf<A>, ReturnWithUnique<PhotonOf<A>, ReturnType<M>>, ExtensionsOf<A>>
    : never;
