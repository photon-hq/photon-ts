import { describe, test } from "bun:test";
import crypto from "node:crypto";
import { App, defaultExtensions, onboardModifier, type SomeExtension } from "photon";
import { promptModifier } from "../modifiers/prompt.ts";
import { Mock } from "../target.ts";

describe("sending", () => {
    const app = new App("Test Bot", "hi").extension({
        prompt: promptModifier,
    });

    const ext = {
        modifiers: {
            onboard: onboardModifier,
            prompt: promptModifier,
        },
    } satisfies SomeExtension;

    const app1 = new App("hi", "hi");
    // const app2 = app1.extension(ext).onboard().use(promptModifier("1"));
    const app2 = app1.extension(ext).onboard().prompt("mobai test").prompt("ryan test").prompt("test");

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
