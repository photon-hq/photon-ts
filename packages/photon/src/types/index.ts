import type { Merge } from "type-fest";

export * from "../modifiers/setup/type.ts";
export * from "./compiled.ts";

import type { BaseModIn, BaseModOf, BaseModOut, SomeUniqueBaseModifier } from "../core/modifier.ts";

export type WithoutKey<K extends PropertyKey> = { [P in K]?: never };
export type OmitDiscriminant<T, K extends keyof T> = T extends any ? Omit<T, K> : never;

export const BasePhoton: unique symbol = Symbol("base");
export type WithBase<B extends string> = { [BasePhoton]: B };
export type BaseOf<P> = P extends { [BasePhoton]: infer U } ? U : object;

export const UniquePhoton: unique symbol = Symbol("unique");
export type UniqueOf<P> = P extends { [UniquePhoton]: infer U } ? U : object;
export type WithUnique<U extends object> = { [UniquePhoton]: U };
export type IsUnique<M> = M extends SomeUniqueBaseModifier<any, any, any> ? true : false;

export type ReturnWithUnique<P, M> = Merge<
    Merge<P, BaseModOut<M>>,
    Merge<WithBase<BaseModOf<M>>, IsUnique<M> extends true ? WithUnique<Merge<UniqueOf<P>, BaseModIn<M>>> : object>
>;


// helper: exact type equality check that handles `never`
type IsEqual<X, Y> =
    (<T>() => T extends X ? 1 : 2) extends
        (<T>() => T extends Y ? 1 : 2)
        ? (<T>() => T extends Y ? 1 : 2) extends
            (<T>() => T extends X ? 1 : 2)
            ? true
            : false
        : false;

// Non-distributive wrapper to keep unions intact
type _DeepMerge<A, B> =
// if either is never, return the other
    [A] extends [never] ? B :
        [B] extends [never] ? A :
            // if exactly the same type, keep it
            IsEqual<A, B> extends true ? A :
                // arrays: concat (variadic tuples if tuples; still fine for arrays)
                A extends readonly unknown[]
                    ? (B extends readonly unknown[] ? [...A, ...B] : B)
                    : A extends object
                        ? (B extends object
                            ? { [K in keyof A | keyof B]:
                                K extends keyof A
                                    ? (K extends keyof B ? DeepMerge<A[K], B[K]> : A[K])
                                    : K extends keyof B
                                        ? B[K]
                                        : never
                            }
                            : B)
                        : B;

// Public entry ensures non-distribution by boxing in tuples
export type DeepMerge<A, B> = _DeepMerge<[A] extends [never] ? never : A, [B] extends [never] ? never : B>;
