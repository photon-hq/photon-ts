import { describe, test } from "bun:test";
import { $, instructions, state } from "photon";
import { Mock } from "../target.ts";
import z from "zod";

describe("sending", () => {
    test(
        "one-way sending from user",
        async () => {
            const app = $(() => {
                const onboard = state("onboard", z.boolean()).default(false)
                
                instructions("You are Ryan.")
                
                if (!onboard) {
                    instructions("You are a high school student.")
                } else {
                    instructions("You are a college student.")
                }
            })
            
            await app.deploy(new Mock(""))

            await new Promise(() => {});
        },
        60 * 60 * 1000,
    );
});
