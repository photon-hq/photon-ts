import { Database } from "bun:sqlite";
import type {
  Chat,
  ChatMessage,
  Attachment,
  ChatRow,
  GetMessagesOptions,
  GetChatsOptions,
  MessageRow,
} from "../types/db";
import { defaultPath, getMessageBody, parseChat } from "../utils/db";
import { logNeedAuth } from "./log";
import { DatabaseError } from "../types/errors";

let db: Database | null = null;

function connectImessageSqliteDB(): Database {
  const p = defaultPath();
  try {
    db = new Database(p, { readonly: true });
    return db;
  } catch (error: any) {
    let errorMessage = "Failed to connect to Messages database";

    if (error?.code === "SQLITE_AUTH" || error?.errno === 23) {
      errorMessage = logNeedAuth();
    } else if (error?.code === "SQLITE_CANTOPEN") {
      errorMessage =
        "iMessage database not found - make sure you're on macOS with iMessage enabled";
    }

    throw new DatabaseError(errorMessage, error);
  }
}

function getLatestMessageId(): number {
  if (!db) connectImessageSqliteDB();
  if (!db) throw new Error("Failed to connect to database");

  try {
    const result = db
      .prepare("SELECT MAX(message_id) FROM chat_message_join")
      .get() as any;
    return result?.[0] || 0;
  } catch (error) {
    console.error("Error getting latest message ID:", error);
    return 0;
  }
}

function getRecentChats(opts: GetChatsOptions = {}): Chat[] {
  const { limit = 200, format = false } = opts;

  if (!db) connectImessageSqliteDB();
  if (!db) throw new Error("Failed to connect to database");

  try {
    const query = `
      SELECT cmj.chat_id,
             GROUP_CONCAT(DISTINCT h.id) as address,
             c.display_name,
             m.attributedBody,
             m.text,
             datetime(m.date/1000000000 + 978307200,'unixepoch','localtime') as lastReceived,
             c.service_name,
             c.guid as replyId,
             m.item_type,
             m.group_action_type,
             m.share_status,
             cmj.message_id,
             MAX(m.date)
      FROM chat as c
      INNER JOIN chat_message_join as cmj ON cmj.chat_id = c.ROWID
      INNER JOIN message as m ON cmj.message_id = m.ROWID
      INNER JOIN chat_handle_join as chj ON chj.chat_id = c.ROWID
      INNER JOIN handle as h ON chj.handle_id = h.ROWID
      GROUP BY cmj.chat_id
      ORDER BY m.date DESC
      LIMIT ?
    `;

    const rows = db.prepare(query).all(limit);
    return rows.map((row: any) => parseChat(row, format));
  } catch (error) {
    console.error("Error getting recent chats:", error);
    return [];
  }
}

function getChat(chatId: number): Chat | null {
  if (!db) connectImessageSqliteDB();
  if (!db) throw new Error("Failed to connect to database");

  try {
    const query = `
      SELECT cmj.chat_id,
             GROUP_CONCAT(DISTINCT h.id) as address,
             c.display_name,
             m.attributedBody,
             m.text,
             datetime(m.date/1000000000 + 978307200,'unixepoch','localtime') as lastReceived,
             c.service_name,
             c.guid as replyId,
             m.item_type,
             m.group_action_type,
             m.share_status,
             MAX(m.date)
      FROM chat as c
      INNER JOIN chat_message_join as cmj ON cmj.chat_id = c.ROWID
      INNER JOIN message as m ON cmj.message_id = m.ROWID
      INNER JOIN chat_handle_join as chj ON chj.chat_id = c.ROWID
      INNER JOIN handle as h ON chj.handle_id = h.ROWID
      GROUP BY cmj.chat_id
      HAVING cmj.chat_id = ?
    `;

    const row = db.prepare(query).get(chatId);
    return row ? parseChat(row, false) : null;
  } catch (error) {
    console.error("Error getting chat:", error);
    return null;
  }
}

function getChatMessages(
  chatId: number,
  opts: GetMessagesOptions = {}
): ChatMessage[] {
  const { limit = 100, format = false } = opts;

  if (!db) connectImessageSqliteDB();
  if (!db) throw new Error("Failed to connect to database");

  try {
    const query = `
      SELECT m.ROWID as message_id,
             m.is_from_me,
             m.text,
             m.attributedBody,
             h.id as handle_id,
             datetime(m.date/1000000000 + 978307200,'unixepoch','localtime') as received,
             m.item_type,
             m.group_action_type,
             m.share_status
      FROM message as m
      INNER JOIN chat_message_join as cmj ON cmj.message_id = m.ROWID
      LEFT JOIN handle as h ON m.handle_id = h.ROWID
      WHERE cmj.chat_id = ?
      ORDER BY m.date DESC
      LIMIT ?
    `;

    const rows = db.prepare(query).all(chatId, limit) as MessageRow[];

    return rows.map((row: MessageRow) => {
      const {
        message_id: messageId,
        is_from_me: isMe,
        text,
        attributedBody,
        handle_id: handleId,
        received,
        item_type: itemType,
        group_action_type: groupActionType,
        share_status: shareStatus,
      } = row;

      const message: ChatMessage = {
        id: messageId || 0,
        chatId: chatId || 0,
        from: "Unknown",
        isMe: isMe === 1,
        body: "",
        received: received || "N/A",
      };

      // Set the sender
      if (message.isMe) {
        message.from = "Me";
      } else if (handleId && handleId.trim() !== "") {
        message.from = handleId;
      } else {
        message.from = "Contact";
      }

      message.body = getMessageBody(
        text,
        attributedBody,
        itemType || 0,
        groupActionType || 0,
        shareStatus || 0,
        format
      );

      // For now, skip attachments in the simplified version
      message.attachments = [];

      return message;
    });
  } catch (error) {
    console.error("Error getting chat messages:", error);
    return [];
  }
}

// [Not stable yet]: Fetch attachment details by ID
function getAttachment(attachmentId: number): Attachment | null {
  if (!db) connectImessageSqliteDB();
  if (!db) throw new Error("Failed to connect to database");

  try {
    const query = `
      SELECT transfer_name, filename, mime_type
      FROM attachment
      WHERE ROWID = ?
      LIMIT 1
    `;

    const row = db.prepare(query).get(attachmentId) as any;
    if (!row) return null;

    const filename = row[0] as string | null;
    const path = row[1] as string | null;
    const type = row[2] as string | null;

    return {
      id: attachmentId,
      filename: filename || "Attachment",
      path: path || "Unknown",
      type: type || "Unknown",
    };
  } catch (error) {
    console.error("Error getting attachment:", error);
    return null;
  }
}

function getMessages(
  chatIdentifier: string | number,
  opts: GetMessagesOptions = {}
): ChatMessage[] {
  if (!db) connectImessageSqliteDB();
  if (!db) throw new Error("Failed to connect to database");

  const { limit = 100 } = opts;

  let chatRow: ChatRow | null = null;
  if (/^\d+$/.test(String(chatIdentifier))) {
    chatRow = db
      .prepare(`SELECT ROWID as id, guid FROM chat WHERE ROWID = ?`)
      .get(chatIdentifier) as ChatRow | null;
  }

  // if (!chatRow) {
  //   chatRow = db
  //     .prepare(`SELECT ROWID as id, guid FROM chat WHERE guid = ?`)
  //     .get(chatIdentifier) as ChatRow | null;
  // }

  // // 如果没找到，尝试按 handle (电话号码/email) 找到 chat
  // if (!chatRow) {
  //   const chatRowByHandle = db
  //     .prepare(
  //       `
  //     SELECT c.ROWID AS id, c.guid
  //     FROM chat c
  //     JOIN chat_handle_join chj ON chj.chat_id = c.ROWID
  //     JOIN handle h ON h.ROWID = chj.handle_id
  //     WHERE h.id LIKE ?
  //     LIMIT 1
  //   `
  //     )
  //     .get(`%${chatIdentifier}%`) as ChatRow | null;
  //   chatRow = chatRowByHandle;
  // }

  if (!chatRow) throw new Error("chat not found for: " + chatIdentifier);

  // Use the new getChatMessages function for better results
  return getChatMessages(chatRow.id, { limit, format: opts.format });
}

// Close the database connection
function closeConnection(): void {
  if (db) {
    try {
      db.close();
      db = null;
    } catch (error) {
      console.warn("Warning: Failed to close database connection:", error);
    }
  }
}

export {
  connectImessageSqliteDB as connect,
  getLatestMessageId,
  getRecentChats,
  getChat,
  getChatMessages,
  getAttachment,
  getMessages,
  closeConnection,
};
