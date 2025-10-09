import { describe, test } from "bun:test";
import crypto from "node:crypto";
import { App, onboardModifier, type SomeExtension } from "photon";
import { z } from "zod";
import { promptModifier } from "../modifiers/prompt.ts";
import { Mock } from "../target.ts";
import { sendAction } from "../../../photon/src/actions/send.ts";

describe("sending", () => {
    const app = new App("Test Bot", "hi").extension({
        actions: {},
        modifiers: {
            prompt: promptModifier,
        },
        photonType: z.object({}),
    });

    const ext = {
        actions: {
            hi: sendAction
        },
        modifiers: {
            prompt: promptModifier,
        },
        photonType: z.object({}),
    } satisfies SomeExtension;

    const app1 = new App("hi", "hi");
    // const app2 = app1.extension(ext).onboard().use(promptModifier("1"));
    const app2 = app1.extension(ext).onboard((context) => {
        context.hi("");
    });

    test(
        "one-way sending from user",
        async () => {
            const userId = crypto.randomUUID();

            console.log(`userId: ${userId}`);

            const mockInstance = new Mock(userId);

            const a = app.onboard(() => {});

            const a1 = new App().onboard(() => {}).modifier(promptModifier("1"));
            const a3 = new App().onboard(() => {});
            const a2 = new App("hi", "hi");

            const c = a2.use(a1);

            function hi(): typeof c {
                return c;
            }

            const d = hi();

            await app2.deploy(mockInstance.mockKey, mockInstance);

            await mockInstance.sendMessage("hello, world");

            await new Promise(() => {});
        },
        60 * 60 * 1000,
    );
});
