import { z } from "zod";
import { createPlugin } from "../core";

export const sendPlugin = createPlugin({
    name: "send",
    type: "modifier",
    input: z.object({
        flow: z.array(z.object({ type: z.string(), content: z.string() })).optional(),
    }),
    output: z.object({}),
    install(setState, getState) {
        return {
            send<TContext>(this: TContext, content: string): TContext {
                const currentState = getState();
                const currentFlow = currentState.flow ?? [];
                const newFlowItem = { type: "send", content };

                setState({
                    ...currentState,
                    flow: [...currentFlow, newFlowItem],
                });
                return this;
            },
        };
    },
});
