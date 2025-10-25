import { describe, expect, test } from "bun:test";
import { $, instructions, reply, state } from "photon";
import z from "zod";
import { hook } from "../../../photon/src/modifiers/hook.ts";
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

        const userIdFromGateway = await mockInstance.userId(mockInstance.mockId);
        expect(userIdFromGateway).not.toBeNull();

        const externalIdFromGateway = await mockInstance.externalId(userIdFromGateway ?? "");
        expect(externalIdFromGateway).not.toBeNull();

        expect(externalIdFromGateway).toBe(mockInstance.mockId);

        expect(mockInstance.idStorage.getByUserId(userIdFromGateway ?? "")).toBe(mockInstance.mockId);
        expect(mockInstance.idStorage.getByExternalId(externalIdFromGateway ?? "")).toBe(userIdFromGateway ?? "");

        const secondTimeUserIdFromGateway = await mockInstance.gateway.Client.getUserId(mockInstance.mockId);
        expect(secondTimeUserIdFromGateway).toBe(userIdFromGateway ?? "");
    });
});

describe("sending", () => {
    test(
        "one-way sending from user",
        async () => {
            const mockInstance = new Mock();

            const app = $(() => {
                hook(
                    async () => {
                        const a = state("a", z.string())
                        a.update("new value")
                        await reply("Hello!");

                        return {
                            history: [],
                        };
                    },
                    {
                        type: "modifyHistoryBefore",
                    },
                );

                hook(
                    async () => {
                        const a = state("a", z.string())
                        await reply(`Hello! x2 with ${a}`);

                        return {
                            history: [],
                        };
                    },
                    {
                        type: "modifyHistoryAfter",
                    },
                );
            });

            app.deploy(
                {
                    projectId: mockInstance.apiKey,
                    projectSecret: mockInstance.apiKey,
                },
                mockInstance,
            );

            mockInstance.sendMessage("hello world");
            mockInstance.sendMessage("hello world 111");

            await new Promise(() => {});
        },
        60 * 60 * 1000,
    );
});
