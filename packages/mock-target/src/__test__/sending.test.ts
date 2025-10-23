import { describe, test } from "bun:test";
import { $, instructions, state } from "photon";
import { Mock } from "../target.ts";
import z from "zod";

process.env.GATEWAY_URL = "http://127.0.0.1:4001";

describe("sending", () => {
    test(
        "one-way sending from user",
        async () => {
            const mockInstance = new Mock();
            
            const app = $(() => {
                const onboard = state("onboard", z.boolean()).default(false)
                
                instructions("You are Ryan.")
                
                if (!onboard) {
                    instructions("You are a high school student.")
                } else {
                    instructions("You are a college student.")
                }
            })
            
            app.deploy({
                projectId: mockInstance.apiKey,
                projectSecret: mockInstance.apiKey,
            }, mockInstance)
            
            mockInstance.sendMessage("hello world")

            await new Promise(() => {});
        },
        60 * 60 * 1000,
    );
});
