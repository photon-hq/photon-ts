import { z } from "zod";
import { createPlugin } from "../core";

export const onboardPlugin = createPlugin({
    name: "onboard",
    type: "base",
    output: z.object({
        flow: z.array(z.object({ type: z.string(), content: z.string() })).default([]),
    }),
    install() {
        return {
            onboard<TContext>(this: TContext): TContext {
                return this;
            },
        };
    },
});
