import { describe, test } from "bun:test";
import crypto from "crypto";
import { App, onboardModifier, toolModifier } from "photon";
import { Mock } from "../target.ts";

describe("sending", () => {
    const app = new App("Test Bot", "hi");

    test(
        "one-way sending from user",
        async () => {
            const userId = crypto.randomUUID();

            console.log(`userId: ${userId}`);

            const mockInstance = new Mock(userId);

            const c = app.tool("hi");
            const d = app.baseModifier(toolModifier("hi"));

            const a = app.onboard().send("hello world from photon").asPhoton();
            const b = app.onboard().asPhoton();
            app.use(a);

            await app.deploy(mockInstance.mockKey, mockInstance);

            await mockInstance.sendMessage("hello, world");

            await new Promise(() => {});
        },
        60 * 60 * 1000,
    );
});
