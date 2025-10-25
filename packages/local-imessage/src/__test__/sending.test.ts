import { describe, test } from "bun:test";
import { $, instructions, reply } from "photon";
import { LocalIMessage } from "../target.ts";
import { hook } from "../../../photon/src/modifiers/hook.ts";

process.env.GATEWAY_URL = "127.0.0.1:50052";

describe(
    "Listen and auto-reply (real iMessage)",
    () => {
        test(
            "Auto-reply via AI Agent",
            async () => {
                const imessage = new LocalIMessage();

                const app = $(() => {
                    hook(async () => {
                        await reply("Hello!")
                        
                        return {
                            history: []
                        }
                    }, {
                        type: "modifyHistory"
                    })
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

