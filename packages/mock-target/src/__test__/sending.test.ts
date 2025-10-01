import { test, describe } from "bun:test";
import crypto from "node:crypto";
import { App, createApp, defaultExtensions } from "photon";
import { Mock } from "../target.ts";
import { promptModifier } from "../modifiers/prompt.ts";

const ext = {
    modifiers: {
        prompt: promptModifier,
    }
}

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

            // const a = app.onboard().prompt("mobai test").send("hello world from photon");
            // const b = app.onboard();
            // const c = app.onboard();

            const test = new App("Test Bot", "hi").onboard().send("hello world from photon").extension(ext).prompt("mobai test");

            await test.deploy(mockInstance.mockKey, mockInstance);

            await mockInstance.sendMessage("hello, world");

            await new Promise(() => {});
        },
        60 * 60 * 1000,
    );
});
