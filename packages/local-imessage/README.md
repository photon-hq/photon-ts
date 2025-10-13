# @photon/local-imessage

TypeScript/Bun toolkit for reading the macOS iMessage database, plus a Photon gateway target example for bridging local data.

## Why it matters

- Uses `bun:sqlite` to talk to `chat.db` and pull chats, messages, and attachments
- Handles Apple timestamps and rich text via the bundled Swift `extract_attributed` helper
- Provides an `ImessageDatabase` class that owns connection lifecycle, querying, and safe shutdown
- Ships an `ImessageService` implementation that shows how to plug iMessage into the Photon Gateway
- macOS-only design with friendly permission hints and wrapped errors

## Prerequisites

- macOS with iMessage enabled
- [Bun](https://bun.com) ≥ 1.2
- Your terminal must have **Full Disk Access** (System Settings → Privacy & Security → Full Disk Access)

## Quick start

```bash
# Install dependencies from the repository root
bun install
```

```typescript
import { ImessageDatabase } from "@photon/local-imessage/src/lib/db";

const db = new ImessageDatabase();

const chats = db.getRecentChats({ limit: 5, format: true });
console.log(chats);

if (chats[0]) {
  const messages = db.getChatMessages(chats[0].id, { limit: 10, format: true });
  console.log(messages);
}

db.closeConnection();
```

> `ImessageDatabase` connects to `~/Library/Messages/chat.db` during construction and raises a `DatabaseError` if it fails (including whether permission is required).

## API overview

- `new ImessageDatabase()` – initialize and connect (macOS only)
- `getLatestMessage()` – return the most recent message or `null`
- `getRecentChats({ limit, format })` – list chats ordered by recent activity
- `getChat(chatId)` – fetch details for a single chat
- `getChatMessages(chatId, { limit, format })` – retrieve chat messages (optionally formatting rich text)
- `getMessages(chatIdOrGuid, { limit, format })` – fetch messages by chat ID or GUID
- `getAttachment(attachmentId)` – resolve attachment metadata by ID
- `closeConnection()` – close the database connection explicitly

Every query runs in read-only mode. Missing permissions or a non-existent database will raise a `DatabaseError` with a human-friendly message.

## Photon integration

`src/target.ts` contains `ImessageService`, an implementation of the Photon `Target` interface. It demonstrates how to start a local target, register a user, and forward messages—ready for you to swap in real iMessage data flows.

## Testing

```bash
bun test
```

Integration checks only run on macOS with the proper permissions because they need access to the real Messages database.

## References

- `src/__test__/imessage.ts` – interactive sample script
- `src/utils/db.ts` – helpers for database paths, rich text parsing, and timestamp conversion
- `src/lib/log.ts` – permission hint utilities
