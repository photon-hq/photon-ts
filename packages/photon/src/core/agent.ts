import type { Promisable } from "type-fest";
import type { Context } from "./context";
import type { HandoffOptions } from "./handoff-options";

type Builder = (context: Context) => Promisable<void>;

export function $(name: string, builder: Builder): void;
export function $(builder: Builder, options?: HandoffOptions): void;
export function $(
    nameOrBuilder: string | Builder,
    builderOrOptions?: Builder | HandoffOptions,
): void {
    let name: string | undefined;
    let builder: Builder;
    let options: HandoffOptions | undefined;

    if (typeof nameOrBuilder === "string") {
        name = nameOrBuilder;
        builder = builderOrOptions as Builder;
    } else {
        builder = nameOrBuilder;
        options = builderOrOptions as HandoffOptions | undefined;
    }

    // TODO: implement registration using name, builder, and options
    void name;
    void builder;
    void options;
}