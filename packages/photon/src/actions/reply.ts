import { aware } from "../utils";

export async function reply(content: string) {
    await aware(async (context) => {
        await context.app?.action('reply', { 
            content,
            userId: context.user?.id
        });
    });
}
