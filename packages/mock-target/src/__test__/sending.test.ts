import { describe, test } from "bun:test";
import crypto from "node:crypto";
import { createApp, defaultExtensions } from "photon";
import { promptModifier } from "../modifiers/prompt.ts";
import { Mock } from "../target.ts";

describe("sending", () => {
    const app = createApp({
        name: "Test Bot",
        description: "hi",
        extensions: {
            ...defaultExtensions,
            prompt: promptModifier,
        },
    });

    test(
        "one-way sending from user",
        async () => {
            const userId = crypto.randomUUID();

            console.log(`userId: ${userId}`);

            const mockInstance = new Mock(userId);

            const a = app.onboard().prompt("mobai test").send("hello world from photon");
            const b = app.onboard();
            const c = app.onboard();

            await a.deploy(mockInstance.mockKey, mockInstance);

            await mockInstance.sendMessage("hello, world");

            await new Promise(() => {});
        },
        60 * 60 * 1000,
    );
});
