import {test, describe} from "bun:test";
import {App} from "../app";

describe("deploy", () => {
    const app = new App('Parcel', '')

    test("openai compatible deploy", async () => {
        await app.deploy()

        await new Promise(resolve => setTimeout(resolve, 5000));
    });
});