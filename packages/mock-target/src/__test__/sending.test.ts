import { describe, test } from "bun:test";
import crypto from "node:crypto";
import { App, createApp, defaultExtensions, onboardModifier, type SomeExtension } from "photon";
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

    const ext = {
        modifiers: {
            onboard: onboardModifier,
            prompt: promptModifier,
        },
    } satisfies SomeExtension;

    const app1 = new App("hi", "hi");
    const app2 = app1.extension(ext).onboard().prompt("1").prompt("2");

    test(
        "one-way sending from user",
        async () => {
            const userId = crypto.randomUUID();

            console.log(`userId: ${userId}`);

            const mockInstance = new Mock(userId);

            const a = app.onboard().prompt("mobai test").send("hello world from photon");
            const b = app.onboard();
            const c = app.onboard();

            await app2.deploy(mockInstance.mockKey, mockInstance);

            await mockInstance.sendMessage("hello, world");

            await new Promise(() => {});
        },
        60 * 60 * 1000,
    );
});
