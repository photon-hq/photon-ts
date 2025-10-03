import type { Merge } from "type-fest";

export * from "./compiled-photon.ts";

import type { ModIn, ModOut, SomeUniqueModifier } from "../modifiers/some-modifier.ts";

export type Promisable<T> = T | Promise<T>;

export type WithoutKey<K extends PropertyKey> = { [P in K]?: never };
export type OmitDiscriminant<T, K extends keyof T> = T extends any ? Omit<T, K> : never;
export type IsBroadString<T> = string extends T ? (T extends string ? true : false) : false;

export const UniquePhoton: unique symbol = Symbol("unique");
export type UniqueOf<P> = P extends { [UniquePhoton]: infer U } ? U : {};
export type WithUnique<U extends {}> = { [UniquePhoton]: U };
export type IsUnique<M> = M extends SomeUniqueModifier<any, any> ? true : false;
// return-photon builder that conditionally accumulates unique
export type ReturnWithUnique<P, M> = Merge<
    Merge<P, ModOut<M>>,
    IsUnique<M> extends true ? WithUnique<Merge<UniqueOf<P>, ModIn<M>>> : {}
>;
