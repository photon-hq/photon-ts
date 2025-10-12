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

type ExtendedMessageRow = MessageRow & { chat_id?: number | null };

export class ImessageDatabase {
  private db: Database | null = null;

  constructor() {
    if (process.platform !== "darwin") {
      throw new DatabaseError(
        "iMessage database access is only supported on macOS",
        new Error(`Unsupported platform: ${process.platform}`)
      );
    }

    this.connect();
  }

  connect(): Database {
    if (this.db) {
      return this.db;
    }

    const path = defaultPath();

    try {
      this.db = new Database(path, { readonly: true });
      return this.db;
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

  getLatestMessage(): ChatMessage | null {
    const db = this.ensureConnection();

    try {
      const row = db
        .prepare(
          `
        SELECT m.ROWID as message_id,
               m.is_from_me,
               m.text,
               m.attributedBody,
               h.id as handle_id,
               datetime(m.date/1000000000 + 978307200,'unixepoch','localtime') as received,
               m.item_type,
               m.group_action_type,
               m.share_status,
               cmj.chat_id
        FROM message as m
        LEFT JOIN chat_message_join as cmj ON cmj.message_id = m.ROWID
        LEFT JOIN handle as h ON m.handle_id = h.ROWID
        ORDER BY m.date DESC
        LIMIT 1
      `
        )
        .get() as ExtendedMessageRow | undefined;

      if (!row) return null;

      return this.mapMessageRowToChatMessage(row, row.chat_id ?? 0, false);
    } catch (error) {
      console.error("Error getting latest message ID:", error);
      return null;
    }
  }

  getRecentChats(opts: GetChatsOptions = {}): Chat[] {
    const { limit = 200, format = false } = opts;
    const db = this.ensureConnection();

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

  getChat(chatId: number): Chat | null {
    const db = this.ensureConnection();

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

  getChatMessages(
    chatId: number,
    opts: GetMessagesOptions = {}
  ): ChatMessage[] {
    const { limit = 100, format = false } = opts;
    const db = this.ensureConnection();

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

      return rows.map((row: MessageRow) =>
        this.mapMessageRowToChatMessage(row, chatId || 0, format)
      );
    } catch (error) {
      console.error("Error getting chat messages:", error);
      return [];
    }
  }

  getAttachment(attachmentId: number): Attachment | null {
    const db = this.ensureConnection();

    try {
      const query = `
        SELECT transfer_name, filename, mime_type
        FROM attachment
        WHERE ROWID = ?
        LIMIT 1
      `;

      const row = db.prepare(query).get(attachmentId) as
        | {
            transfer_name: string | null;
            filename: string | null;
            mime_type: string | null;
          }
        | undefined;

      if (!row) return null;

      return {
        id: attachmentId,
        filename: row.transfer_name ?? "Attachment",
        path: row.filename ?? "Unknown",
        type: row.mime_type ?? "Unknown",
      };
    } catch (error) {
      console.error("Error getting attachment:", error);
      return null;
    }
  }

  getMessages(
    chatIdentifier: string | number,
    opts: GetMessagesOptions = {}
  ): ChatMessage[] {
    const db = this.ensureConnection();
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

    return this.getChatMessages(chatRow.id, {
      limit,
      format: opts.format,
    });
  }

  closeConnection(): void {
    if (!this.db) {
      return;
    }

    try {
      this.db.close();
    } catch (error) {
      console.warn("Warning: Failed to close database connection:", error);
    } finally {
      this.db = null;
    }
  }

  private ensureConnection(): Database {
    if (!this.db) {
      this.connect();
    }

    if (!this.db) {
      throw new Error("Failed to connect to database");
    }

    return this.db;
  }

  private mapMessageRowToChatMessage(
    row: ExtendedMessageRow,
    fallbackChatId: number,
    format: boolean
  ): ChatMessage {
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

    const chatId = row.chat_id ?? fallbackChatId ?? 0;

    const message: ChatMessage = {
      id: messageId || 0,
      chatId,
      from: "Unknown",
      isMe: isMe === 1,
      body: "",
      received: received || "N/A",
    };

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

    message.attachments = [];

    return message;
  }
}
