import type { Merge } from "type-fest";

export * from "./flow.ts";
export * from "./compiled.ts";

import type { SomeUniqueBaseModifier, BaseModIn, BaseModOf, BaseModOut } from "../core/modifier.ts";

export type WithoutKey<K extends PropertyKey> = { [P in K]?: never };
export type OmitDiscriminant<T, K extends keyof T> = T extends any ? Omit<T, K> : never;

export const BasePhoton: unique symbol = Symbol("base");
export type WithBase<B extends string> = { [BasePhoton]: B };
export type BaseOf<P> = P extends { [BasePhoton]: infer U } ? U : {};

export const UniquePhoton: unique symbol = Symbol("unique");
export type UniqueOf<P> = P extends { [UniquePhoton]: infer U } ? U : {};
export type WithUnique<U extends {}> = { [UniquePhoton]: U };
export type IsUnique<M> = M extends SomeUniqueBaseModifier<any, any, any> ? true : false;

export type ReturnWithUnique<P, M> = Merge<
    Merge<P, BaseModOut<M>>,
    Merge<WithBase<BaseModOf<M>>, IsUnique<M> extends true ? WithUnique<Merge<UniqueOf<P>, BaseModIn<M>>> : {}>
>;
