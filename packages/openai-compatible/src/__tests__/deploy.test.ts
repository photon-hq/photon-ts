import {test, describe} from "bun:test";
import {App} from "something";
import {OpenAICompatibleTarget} from "../target.ts";

describe("deploy", () => {
    const app = new App('Parcel', '')

    test("openai compatible deploy", async () => {
        await app.deploy(new OpenAICompatibleTarget())

        await new Promise(() => {});
    }, 3600000);
});