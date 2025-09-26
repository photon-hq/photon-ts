import { describe, test } from "bun:test";
import { App } from "../core";
import { onboardPlugin, promptPlugin, sendPlugin } from "../plugins";

describe("send", () => {
    test("should run the app and print the state", () => {
        const app = new App();

        app.use(onboardPlugin)
            .use(promptPlugin)
            .use(sendPlugin)
            .prompt("mobai")
            .send("mobai")
            .send("mobai");

        console.dir(app.getState(), { depth: null });
    });
});
