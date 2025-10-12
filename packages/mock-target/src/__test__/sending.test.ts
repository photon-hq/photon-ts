import { describe, test } from "bun:test";
import crypto from "node:crypto";
import { App } from "photon";
import { Mock } from "../target.ts";

describe("sending", () => {
    test(
        "one-way sending from user",
        async () => {
            const userId = crypto.randomUUID();

            console.log(`userId: ${userId}`);

            const mockInstance = new Mock(userId);

            await new App("test", "test")
                .onboard(async (context) => {
                    await context.send("hello, world from server");
                })
                .deploy(mockInstance.apiKey, mockInstance);

            await mockInstance.sendMessage("hello, world from user");

            await new Promise(() => {});
        },
        60 * 60 * 1000,
    );
});
