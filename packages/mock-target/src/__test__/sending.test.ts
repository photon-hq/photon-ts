import { describe, test } from "bun:test";
import crypto from "node:crypto";
import { $ } from "photon";
import { Mock } from "../target.ts";

describe("sending", () => {
    test(
        "one-way sending from user",
        async () => {
            $(() => { }, {})

            await new Promise(() => {});
        },
        60 * 60 * 1000,
    );
});
