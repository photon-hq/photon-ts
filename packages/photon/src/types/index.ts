import type { Merge as _Merge } from "type-fest";

export type Merge<A, B> = { [K in keyof _Merge<A, B>]: _Merge<A, B>[K] } & {};

export * from "../modifiers/setup/type.ts";
export * from "./compiled.ts";

import type { BaseModIn, BaseModOf, BaseModOut, SomeUniqueBaseModifier } from "../core/modifier.ts";

export type WithoutKey<K extends PropertyKey> = { [P in K]?: never };
export type OmitDiscriminant<T, K extends keyof T> = T extends any ? Omit<T, K> : never;

export const BasePhoton: unique symbol = Symbol("base");
export type WithBase<B extends string> = { [BasePhoton]: B };
export type BaseOf<P> = P extends { [BasePhoton]: infer U } ? U : object;

export const UniquePhoton: unique symbol = Symbol("unique");
export type UniqueOf<P> = P extends { [UniquePhoton]: infer U } ? U : Record<string, never>;
export type WithUnique<U extends object> = { [UniquePhoton]: U };
export type IsUnique<M> = M extends SomeUniqueBaseModifier<any, any, any> ? true : false;

export type ReturnWithUnique<P, M> = Merge<
    Merge<P, BaseModOut<M>>,
    Merge<WithBase<BaseModOf<M>>, IsUnique<M> extends true ? WithUnique<Merge<UniqueOf<P>, BaseModIn<M>>> : object>
>;
type IsEqual<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? (<T>() => T extends Y ? 1 : 2) extends <T>() => T extends X ? 1 : 2
        ? true
        : false
    : false;

type _DeepMerge<A, B> = [A] extends [never]
    ? B
    : [B] extends [never]
      ? A
      : // if exactly the same type, keep it
        IsEqual<A, B> extends true
        ? A
        : // arrays: concat (variadic tuples if tuples; still fine for arrays)
          A extends readonly unknown[]
          ? B extends readonly unknown[]
              ? [...A, ...B]
              : B
          : A extends object
            ? B extends object
                ? {
                      [K in keyof A | keyof B]: K extends keyof A
                          ? K extends keyof B
                              ? DeepMerge<A[K], B[K]>
                              : A[K]
                          : K extends keyof B
                            ? B[K]
                            : never;
                  }
                : B
            : B;

export type DeepMerge<A, B> = _DeepMerge<[A] extends [never] ? never : A, [B] extends [never] ? never : B>;
