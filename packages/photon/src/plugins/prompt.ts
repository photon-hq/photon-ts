import { z } from "zod";
import { createPlugin } from "../core";

export const promptPlugin = createPlugin({
    name: "prompt",
    type: "modifier",
    input: z.object({
        flow: z.array(z.any()).optional(),
    }),
    output: z.object({}),
    install(setState, getState) {
        return {
            prompt<TContext>(this: TContext, content: string): TContext {
                const currentState = getState();
                const currentFlow = currentState.flow ?? [];
                const newFlowItem = { type: "prompt", content };

                setState({
                    ...currentState,
                    flow: [...currentFlow, newFlowItem],
                });
                return this;
            },
        };
    },
});
