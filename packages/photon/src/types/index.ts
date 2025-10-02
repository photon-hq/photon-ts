import type { Merge } from "type-fest";

export * from "./compiled-photon.ts";
export * from "./flow-types.ts";

import type { BaseModIn, BaseModOf, BaseModOut, SomeUniqueBase } from "../modifiers/some-base.ts";

export type WithoutKey<K extends PropertyKey> = { [P in K]?: never };
export type OmitDiscriminant<T, K extends keyof T> = T extends any ? Omit<T, K> : never;
export type IsBroadString<T> = string extends T ? (T extends string ? true : false) : false;

export const BasePhoton: unique symbol = Symbol("base");
export type WithBase<B extends string> = { [BasePhoton]: B };
export type BaseOf<P> = P extends { [BasePhoton]: infer U } ? U : {};

export const UniquePhoton: unique symbol = Symbol("unique");
export type UniqueOf<P> = P extends { [UniquePhoton]: infer U } ? U : {};
export type WithUnique<U extends {}> = { [UniquePhoton]: U };
export type IsUnique<M> = M extends SomeUniqueBase<any, any, any> ? true : false;
// return-photon builder that conditionally accumulates unique
export type ReturnWithUnique<P, M> = Merge<
    Merge<P, BaseModOut<M>>,
    Merge<WithBase<BaseModOf<M>>, IsUnique<M> extends true ? WithUnique<Merge<UniqueOf<P>, BaseModIn<M>>> : {}>
>;
