import z from "zod";
import { buildInvokbale } from "../core";
import { aware } from "../utils";

export const hookTypeSchema = z.enum(["modifyHistory"]);

type HookOptions = {
    type: z.infer<typeof hookTypeSchema>;
};

export function hook(
    action: (values: { history: History }) => Promise<{ history: History }>,
    options: HookOptions & { type: "modifyHistory" },
) {
    if (options.type === "modifyHistory") {
        aware((c) => {
            c.agentConfig.hooks.add("modifyHistory");
            c.app?.addInvokable("modifyHistory", buildInvokbale(action));
        });
    }
}
