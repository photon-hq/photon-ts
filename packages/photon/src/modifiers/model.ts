import type { NonEmptyString } from "type-fest";
import { aware } from "../utils";

export const Model = {
    default: "smart",
    smart: "smart",
    openai: {
        gpt5: "openai-gpt5"
    }
}

export function model<T extends string>(name: NonEmptyString<T>) {
    aware(context => {
        context.agentConfig.model = name
    })
}