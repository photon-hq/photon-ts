import { describe, test } from "bun:test";
import crypto from "node:crypto";
import { App, onboardModifier, type SomeExtension } from "photon";
import { promptModifier } from "../modifiers/prompt.ts";
import { Mock } from "../target.ts";

describe("sending", () => {
    const app = new App("Test Bot", "hi").extension({
        modifiers: {
            prompt: promptModifier
        }
    });

    const ext = {
        modifiers: {
            prompt: promptModifier,
        },
    } satisfies SomeExtension;

    const app1 = new App("hi", "hi");
    // const app2 = app1.extension(ext).onboard().use(promptModifier("1"));
    const app2 = app1.extension(ext).prompt("mobai test").prompt("ryan test").prompt("test");

    test(
        "one-way sending from user",
        async () => {
            const userId = crypto.randomUUID();

            console.log(`userId: ${userId}`);

            const mockInstance = new Mock(userId);

            const a = app.onboard(() => {
            });

            const a1 = new App().onboard(() => {}).modifier(promptModifier("1"))
            const a2 = new App("hi", "hi")

            a2.use(a1)

            await a2.deploy(mockInstance.mockKey, mockInstance)

            await mockInstance.sendMessage("hello, world");

            await new Promise(() => {});
        },
        60 * 60 * 1000,
    );
});
