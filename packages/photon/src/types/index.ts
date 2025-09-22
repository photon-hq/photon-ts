import type {Merge} from "type-fest";

import './flow-types.ts'
import './compiled-photon.ts';

import type {BaseModIn, BaseModOut, BaseModOf, SomeUniqueBaseModifier} from "../modifiers/some-modifier.ts";

export type WithoutKey<K extends PropertyKey> = { [P in K]?: never };

export const BasePhoton: unique symbol = Symbol('base');
export type WithBase<B extends string> = { [BasePhoton]: B };
export type BaseOf<P> = P extends { [BasePhoton]: infer U } ? U : {};

export const UniquePhoton: unique symbol = Symbol('unique');
export type UniqueOf<P> = P extends { [UniquePhoton]: infer U } ? U : {};
export type WithUnique<U extends {}> = { [UniquePhoton]: U };
export type IsUnique<M> = M extends SomeUniqueBaseModifier<any, any, any> ? true : false;
// return-photon builder that conditionally accumulates unique
export type ReturnWithUnique<P, M> =
    Merge<
        Merge<P, BaseModOut<M>>,
        Merge<
            WithBase<BaseModOf<M>>,
            IsUnique<M> extends true
                ? WithUnique<Merge<UniqueOf<P>, BaseModIn<M>>>
                : {}
        >
    >;
