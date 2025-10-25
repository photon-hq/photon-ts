import z from "zod";
import { buildInvokbale } from "../core";
import { aware } from "../utils";

export const hookTypeSchema = z.enum(["modifyHistoryBefore", "modifyHistoryAfter"]);

type HookOptions = {
    type: z.infer<typeof hookTypeSchema>;
};

export function hook(
    action: (values: { history: History }) => Promise<{ history: History }>,
    options: HookOptions & { type: "modifyHistoryBefore" | "modifyHistoryAfter" },
) {
    if (options.type === "modifyHistoryBefore" || options.type === "modifyHistoryAfter") {
        aware((c) => {
            c.agentConfig.hooks.add(options.type);
            c.app?.addInvokable(options.type, buildInvokbale(action));
        });
    }
}
