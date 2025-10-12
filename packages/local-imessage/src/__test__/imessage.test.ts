import { describe, expect, test } from "bun:test";
import { ImessageDatabase } from "../lib/db";

// These integration checks require access to the macOS Messages database.
const shouldRunIntegration = process.platform === "darwin";

const integrationTest = shouldRunIntegration ? test : test.skip;

describe("ImessageDatabase integration", () => {
  integrationTest(
    "runs the example-safe flow without throwing",
    () => {
      let db: ImessageDatabase | null = null;

      try {
        db = new ImessageDatabase();

        const latestMessage = db.getLatestMessage();
        expect(
          latestMessage === null ||
            (typeof latestMessage.id === "number" &&
              typeof latestMessage.chatId === "number" &&
              typeof latestMessage.from === "string" &&
              typeof latestMessage.received === "string")
        ).toBe(true);

        const recentChats = db.getRecentChats({ limit: 5, format: true });
        expect(Array.isArray(recentChats)).toBe(true);

        if (recentChats.length > 0) {
          const [firstChat] = recentChats;

          if (firstChat && typeof firstChat.id === "number") {
            expect(typeof firstChat.replyId === "string").toBe(true);
            expect(typeof firstChat.service === "string").toBe(true);

            const chatDetail = db.getChat(firstChat.id);
            expect(chatDetail === null || chatDetail.id === firstChat.id).toBe(
              true
            );

            const messages = db.getChatMessages(firstChat.id, {
              limit: 5,
              format: true,
            });
            expect(Array.isArray(messages)).toBe(true);
            if (messages.length > 0) {
              const firstMessage = messages[0];
              if (firstMessage) {
                expect(typeof firstMessage.id === "number").toBe(true);
                expect(typeof firstMessage.chatId === "number").toBe(true);
                expect(typeof firstMessage.body === "string").toBe(true);
                expect(Array.isArray(firstMessage.attachments)).toBe(true);
              }
            }

            const messagesAlt = db.getMessages(firstChat.id, {
              limit: 5,
              format: true,
            });
            expect(Array.isArray(messagesAlt)).toBe(true);
            expect(messagesAlt.length).toBe(messages.length);
            for (const [index, message] of messagesAlt.entries()) {
              expect(typeof message.id === "number").toBe(true);
              expect(typeof message.chatId === "number").toBe(true);
              expect(typeof message.body === "string").toBe(true);
              const compareMessage = messages[index];
              if (compareMessage) {
                expect(message.id).toBe(compareMessage.id);
              }
            }
          }
        }
      } finally {
        db?.closeConnection();
      }
    },
    60_000
  );
});
