import type {App} from "../core/app.ts";
import type { IsBroadString } from "./base.ts";

export type PhotonOf<A> = A extends App<any, any, infer P, any> ? P : never;
export type NameOf<A> = A extends App<infer N, any, any, any> ? N : never;
export type DescriptionOf<A> = A extends App<any, infer D, any, any> ? D : never;
export type ExtensionsOf<A> = A extends App<any, any, any, infer E> ? E : never;
export type IsModuleApp<A> = A extends App<infer N, any, any, any> ? IsBroadString<N> : never;