import type { SomeAction } from "../core/some-action.ts";

export function sendAction(content: string): SomeAction<void> {
    return {
        async main(context): Promise<void> {
            await context.gateway.Server.send({
                userId: context.user.id,
                type: "plain_text",
                content: content,
            });
        },
    };
}
