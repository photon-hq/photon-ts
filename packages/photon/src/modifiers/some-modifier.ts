import {App} from "../app.ts";
import type {Merge} from "type-fest";

export interface SomeModifier<In extends {}, Out extends {}> {
    main<Name extends string, Description extends string, P extends In>(
        app: App<Name, Description, P>
    ): App<Name, Description, Merge<P, Out>>;
}

export type ModIn<M>  = M extends SomeModifier<infer I, any> ? I : never;
export type ModOut<M> = M extends SomeModifier<any, infer O> ? O : never;