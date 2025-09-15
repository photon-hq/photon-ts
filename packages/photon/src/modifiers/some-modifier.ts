import {App} from "../app.ts";

export interface SomeModifier<I = App<any>, O = App<any>> {
    main(app: I): O;
}

export type Modified<M, I> = M extends SomeModifier<I, infer O> ? O : never;