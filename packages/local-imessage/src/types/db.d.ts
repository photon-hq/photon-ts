// Types for better error handling
interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  needsPermission?: boolean;
}

interface Chat {
  id: number;
  replyId: string;
  name: string;
  lastMessage: string;
  lastMessageId: number;
  lastReceived: string;
  service: string;
}

interface ChatMessage {
  id: number;
  chatId: number;
  from: string;
  isMe: boolean;
  body: string;
  received: string;
  attachments?: Attachment[];
}

interface Attachment {
  id: number;
  filename: string;
  path?: string;
  type: string;
}

interface ChatRow {
  id: number;
  guid: string;
}

interface GetMessagesOptions {
  limit?: number;
  offset?: number;
  format?: boolean;
}

interface GetChatsOptions {
  limit?: number;
  format?: boolean;
}

interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  needsPermission?: boolean;
}

interface MessageRow {
  message_id: number;
  is_from_me: number;
  text: string | null;
  attributedBody: Uint8Array | null;
  handle_id: string | null;
  received: string;
  item_type: number;
  group_action_type: number;
  share_status: number;
}

export type {
  GetMessagesOptions,
  Chat,
  ChatMessage,
  Attachment,
  ChatRow,
  GetMessagesOptions,
  GetChatsOptions,
  DatabaseResult,
  MessageRow,
};
