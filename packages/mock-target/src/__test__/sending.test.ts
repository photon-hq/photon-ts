import { describe, test } from "bun:test";
import crypto from "node:crypto";
import { App, onboardModifier, type SomeExtension } from "photon";
import { promptModifier } from "../modifiers/prompt.ts";
import { Mock } from "../target.ts";

describe("sending", () => {
    const ext = {
        modifiers: {
            onboard: onboardModifier,
            prompt: promptModifier,
        },
    } satisfies SomeExtension;

    const app1 = new App("hi", "hi");
    const app2 = app1
        .extension(ext)
        .onboard(() => {})
        .prompt("");

    test(
        "one-way sending from user",
        async () => {
            const userId = crypto.randomUUID();

            console.log(`userId: ${userId}`);

            const mockInstance = new Mock(userId);

            await app2.deploy(mockInstance.mockKey, mockInstance);

            await mockInstance.sendMessage("hello, world");

            await new Promise(() => {});
        },
        60 * 60 * 1000,
    );
});
