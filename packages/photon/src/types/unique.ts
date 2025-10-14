import type { Merge } from "type-fest";
import type { ModIn, ModOut, SomeModifier } from "../core/some-modifier.ts";

export const UniquePhoton: unique symbol = Symbol("unique");

export type UniqueOf<P> = P extends { [UniquePhoton]: infer U } ? U : {};

export type WithUnique<U extends {}> = { [UniquePhoton]: U };

export type IsUnique<M> = M extends SomeModifier<any, any> ? true : false;

export type OmitUnique<T> = { [K in keyof T as K extends typeof UniquePhoton ? never : K]: T[K] };

export type ReturnWithUnique<P, M> = Merge<Merge<P, ModOut<M>>, WithUnique<Merge<UniqueOf<P>, ModIn<M>>>>;
