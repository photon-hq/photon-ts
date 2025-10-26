import { describe, test } from "bun:test";
import { $, instructions } from "photon";
import { AdvancedIMessage } from "../target.ts";

process.env.GATEWAY_URL = "127.0.0.1:50052";

describe(
    "Listen and auto-reply (real iMessage)",
    () => {
        test(
            "Auto-reply via AI Agent",
            async () => {
                const imessage = new AdvancedIMessage();

                const app = $(() => {
                    instructions("You are a helpful assistant.");
                });

                app.deploy(
                    {
                        projectId: crypto.randomUUID(),
                        projectSecret: crypto.randomUUID(),
                    },
                    imessage,
                );

                await new Promise(() => {});
            },
            60 * 60 * 1000,
        );
    },
);

