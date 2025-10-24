import { describe, test } from "bun:test";
import { $, instructions } from "photon";
import { LocalIMessage } from "../target.ts";

process.env.GATEWAY_URL = "127.0.0.1:50052";

describe(
    "Listen and auto-reply (real iMessage)",
    () => {
        test(
            "Auto-reply via AI Agent",
            async () => {
                const imessage = new LocalIMessage();

                const app = $(() => {
                    instructions("You are a helpful assistant. Reply briefly and clearly.");
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

