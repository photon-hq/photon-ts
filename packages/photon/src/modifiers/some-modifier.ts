import {App} from "../app.ts";
import type {Merge} from "type-fest";

export interface SomeModifier<
    Name extends string,
    Description extends string,
    In extends {},
    Out extends {}
> {
    main<P extends In>(app: App<Name, Description, P>): App<Name, Description, Merge<P, Out>>;
}

export type ModIn<M>  = M extends SomeModifier<any, any, infer I, any> ? I : never;
export type ModOut<M> = M extends SomeModifier<any, any, any, infer O> ? O : never;