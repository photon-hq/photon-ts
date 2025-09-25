import { Elysia, t } from "elysia";

export function startServer(port: number) {
    const app = new Elysia()
        .get("/v1/chat/completions", () => {}, {
            body: t.Object({
                model: t.String(),
                messages: t.Array(
                    t.Object({
                        messages: t.Array(
                            t.Object({
                                role: t.String(),
                                content: t.String(),
                            }),
                        ),
                    }),
                ),
            }),
        })
        .listen(port);

    console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
}
