import { describe, test } from "bun:test";
import crypto from "crypto";
import { App, onboardModifier } from "photon";
import { Mock } from "../target.ts";

describe("sending", () => {
    type IsApp<A> = A extends App<string, string> ? true : false;

    const app = new App("test", "test");

    function hi(): IsApp<typeof app> {
        return null as any;
    }

    const a = hi();

    test(
        "one-way sending from user",
        async () => {
            const userId = crypto.randomUUID();

            console.log(`userId: ${userId}`);

            const mockInstance = new Mock(userId);

            const c = app.onboard(() => {});

            const a = new App().onboard(() => {});
            const b = new App().onboard(() => {});
            app.use(a);

            await app.deploy(mockInstance.mockKey, mockInstance);

            await mockInstance.sendMessage("hello, world");

            await new Promise(() => {});
        },
        60 * 60 * 1000,
    );
});
