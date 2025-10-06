import type { Merge } from "type-fest";
import type { AppInstance } from "./app.ts";

export interface SomeModifier<In extends {}, Out extends {}> {
    main<Name extends string, Description extends string, P extends In>(
        app: AppInstance<Name, Description, P>,
    ): AppInstance<Name, Description, Merge<P, Out>>;
}

export interface SomeUniqueModifier<In extends {}, Out extends {}> extends SomeModifier<In, Out> {
    unique: true;
}

type AnyModifier<In extends {}, Out extends {}> = SomeModifier<In, Out> | SomeUniqueModifier<In, Out>;

export type ModIn<M> = M extends AnyModifier<infer I, any> ? I : never;
export type ModOut<M> = M extends AnyModifier<any, infer O> ? O : never;
