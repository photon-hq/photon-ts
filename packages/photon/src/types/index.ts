import type { Merge } from "type-fest";

export * from "./compiled.ts";

import type { ModIn, ModOut, SomeUniqueModifier } from "../core/some-modifier.ts";

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
