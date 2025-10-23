import { describe, expect, test } from "bun:test";
import { $, instructions, state } from "photon";
import z from "zod";
import { Mock } from "../target.ts";

process.env.GATEWAY_URL = "127.0.0.1:50052";

describe("target utils", () => {
    test("user id and external id", async () => {
        const mockInstance = new Mock();

        const app = $(() => {});

        app.deploy(
            {
                projectId: mockInstance.apiKey,
                projectSecret: mockInstance.apiKey,
            },
            mockInstance,
        );
        
        const userIdFromGateway = await mockInstance.userId(mockInstance.mockId)
        expect(userIdFromGateway).not.toBeNull();
        
        const externalIdFromGateway = await mockInstance.externalId(userIdFromGateway ?? "");
        expect(externalIdFromGateway).not.toBeNull();
        
        expect(externalIdFromGateway).toBe(mockInstance.mockId);
        
        expect(mockInstance.idStorage.getByUserId(userIdFromGateway ?? "")).toBe(mockInstance.mockId);
        expect(mockInstance.idStorage.getByExternalId(externalIdFromGateway ?? "")).toBe(userIdFromGateway ?? "");
        
        const secondTimeUserIdFromGateway = await mockInstance.gateway.Client.getUserId(mockInstance.mockId)
        expect(secondTimeUserIdFromGateway).toBe(userIdFromGateway ?? "");
    });
});

describe("sending", () => {
    test(
        "one-way sending from user",
        async () => {
            const mockInstance = new Mock();

            const app = $(() => {
                const onboard = state("onboard", z.boolean()).default(false);

                instructions("You are Ryan.");

                if (!onboard) {
                    instructions("You are a high school student.");
                } else {
                    instructions("You are a college student.");
                }
            });

            app.deploy(
                {
                    projectId: mockInstance.apiKey,
                    projectSecret: mockInstance.apiKey,
                },
                mockInstance,
            );

            mockInstance.sendMessage("hello world");

            await new Promise(() => {});
        },
        60 * 60 * 1000,
    );
});
