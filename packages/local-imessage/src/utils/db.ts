import os from "os";
import path from "path";
import { spawnSync } from "child_process";

import { join } from "path";
import { fileURLToPath } from "url";

import type { Chat } from "../types/db";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

function defaultPath(): string {
  return path.join(os.homedir(), "Library", "Messages", "chat.db");
}

function getMessageBody(
  text: string | null,
  attributedBody: Uint8Array | null,
  itemType: number,
  groupActionType: number,
  shareStatus: number,
  format: boolean = false
): string {
  // If we have text, use it directly
  if (text && text.trim() !== "") {
    return sanitizeText(text, format);
  }

  // If we have attributedBody, try to parse it
  if (attributedBody) {
    return parseAttributedBody(attributedBody);
  }

  return `UnExpected message content, item_type: ${itemType}, group_action_type: ${groupActionType}, share_status: ${shareStatus}`;
}

// Convert Apple timestamp to JavaScript Date
// Apple timestamps are nanoseconds since 2001-01-01, need to convert to Unix timestamp
function convertAppleTimestamp(appleTimestamp: number): string {
  const unixTimestamp = Math.floor(appleTimestamp / 1000000000) + 978307200;
  return new Date(unixTimestamp * 1000).toLocaleString();
}

function sanitizeText(text: string, format: boolean = false): string {
  // Remove object replacement characters
  const sanitized = text.replace(/\ufffc/g, "");

  if (!format) {
    return sanitized
      .replace(/'/g, "'")
      .replace(/'/g, "'")
      .replace(/"/g, '"')
      .replace(/"/g, '"')
      .replace(/…/g, "...");
  }

  // Format URLs as links when format is true
  const urlRegex =
    /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/g;

  console.log("Sanitizing text without formatting:", text);
  console.log("Sanitizing text with formatting:", sanitized);

  return sanitized.replace(urlRegex, '<a href="$&" target="_blank">$&</a>');
}

function parseAttributedBody(attributedBody: Uint8Array): string {
  console.log("Parsing attributed body...");

  try {
    const extractorPath = join(__dirname, "../../extract_attributed");

    const base64 = Buffer.from(attributedBody).toString("base64");
    const swiftResult = spawnSync(extractorPath, [base64], {
      encoding: "utf8",
      cwd: join(__dirname, "../.."),
    });

    if (
      swiftResult.status === 0 &&
      swiftResult.stdout.trim() &&
      !swiftResult.stdout.includes("[Rich message content]")
    ) {
      console.log(
        "Swift CLI parsed attributed body successfully.",
        swiftResult.stdout.trim()
      );

      return swiftResult.stdout.trim();
    }

    console.log(
      "Swift CLI parsing failed or returned no content, falling back..."
    );

    return `Try to parse attributed body but failed.`;
  } catch (error) {
    console.error("Error parsing attributed body:", error);
    return `Failed to parse attributed body.`;
  }
}

function parseChat(row: any, format: boolean = false): Chat {
  const chatId = row.chat_id || row[0];
  const address = row.address || row[1];
  const displayName = row.display_name || row[2];
  const attributedBody = row.attributedBody || row[3];
  const text = row.text || row[4];
  const lastReceived = row.lastReceived || row[5];
  const service = row.service_name || row[6];
  const replyId = row.replyId || row[7];
  const itemType = row.item_type || row[8] || 0;
  const groupActionType = row.group_action_type || row[9] || 0;
  const shareStatus = row.share_status || row[10] || 0;
  const messageId = row.message_id || row[11] || 0;

  const chat: Chat = {
    id: chatId || 0,
    replyId: replyId || "",
    name: "Unknown Contact",
    lastMessage: "[No message content]",
    lastMessageId: messageId || 0,
    lastReceived: lastReceived || "N/A",
    service: service || "Unknown",
  };

  // Simple name assignment - prefer display name, then address
  if (displayName && displayName.trim() !== "") {
    chat.name = displayName;
  } else if (address && address.trim() !== "") {
    // Directly use the email/phone number without parsing
    chat.name = address;
  }

  // Set last message
  chat.lastMessage = getMessageBody(
    text,
    attributedBody,
    itemType,
    groupActionType,
    shareStatus,
    format
  );

  return chat;
}

export {
  defaultPath,
  convertAppleTimestamp,
  sanitizeText,
  parseAttributedBody,
  getMessageBody,
  parseChat,
};
