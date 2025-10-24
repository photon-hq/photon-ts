import z from "zod";
import { aware } from "../utils";

export const hookTypeSchema = z.enum(["modifyHistory"]);

type HookOptions = {
    type: z.infer<typeof hookTypeSchema>
}

export function hook(action: (history: History) => void, options: HookOptions & { type: "modifyHistory" }) {
    if (options.type === "modifyHistory") {
        aware(c => {
            c.agentConfig.hooks.add("modifyHistory")
        })
    }
}