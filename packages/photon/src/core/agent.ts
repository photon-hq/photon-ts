import type { NonEmptyString, Promisable } from "type-fest";
import { Deployable } from "../deploy";
import { buildCompiler } from "./compiler";
import type { HandoffOptions } from "./handoff-options";

export type Builder = () => Promisable<void>;

export function $(builder: Builder): Deployable;
export function $<N extends string>(name: NonEmptyString<N>, builder: Builder, options?: HandoffOptions): void;
export function $(nameOrBuilder: NonEmptyString<string> | Builder, builder?: Builder, options?: HandoffOptions): any {
    if (typeof nameOrBuilder === "function") {
        const rootBuilder = nameOrBuilder;

        const rootCompiler = buildCompiler(rootBuilder);

        return new Deployable(rootCompiler);
    }

    const name = nameOrBuilder;
    
    if (!builder) {
        throw new Error("Builder is required when providing a name");
    }

    const scopedBuilder = builder;
    const scopedOptions = options;
    // Impl for #2
}
