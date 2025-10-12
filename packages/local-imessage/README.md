# @photon/local-imessage

TypeScript/Bun implementation for reading iMessage database on macOS, based on Swift implementation logic.

## 🚀 Features

- **Complete iMessage database access** - Read chats, messages, and attachments
- **Swift-compatible implementation** - Follows the original Swift logic exactly
- **Graceful error handling** - Safe functions that handle permissions elegantly
- **TypeScript support** - Full type safety with comprehensive interfaces
- **Bun optimized** - Uses `bun:sqlite` for optimal performance
- **Permission management** - Clear guidance for macOS Full Disk Access

## 📋 Requirements

- **macOS** with iMessage enabled
- **Full Disk Access** permission for your terminal app
- **Bun** runtime environment

## 🔐 Permission Setup

Before using this API, you need to enable Full Disk Access:

1. Open **System Settings**
2. Go to **Privacy & Security** > **Full Disk Access**
3. Add your terminal app (Terminal.app, iTerm2, or VS Code terminal)
4. **Restart your terminal** application
5. Verify iMessage is enabled on your Mac

## 📚 API Reference

### Core Functions

#### `checkPermissions(): DatabaseResult<boolean>`

Check if the app has necessary permissions to access iMessage database.

#### `safeConnect(dbPath?: string): DatabaseResult<Database>`

Safely connect to the iMessage database.

#### `safeGetRecentChats(opts?: GetChatsOptions): DatabaseResult<Chat[]>`

Get recent chat conversations.

```typescript
interface GetChatsOptions {
  limit?: number; // Default: 200
  format?: boolean; // Default: false (format URLs as links)
}
```

#### `safeGetChatMessages(chatId: number, opts?: GetMessagesOptions): DatabaseResult<ChatMessage[]>`

Get messages from a specific chat.

```typescript
interface GetMessagesOptions {
  limit?: number; // Default: 100
  offset?: number; // Default: 0
  format?: boolean; // Default: false
}
```

## 🧪 Testing

```bash
# Install dependencies
bun install

# Run all tests
bun test

# Run specific test file
bun test src/__test__/db.test.ts
```

## 📖 Example Usage

See `src/example-safe.ts` for comprehensive examples of how to use the API safely with proper error handling.

## ⚠️ Important Notes

- **macOS only** - This API only works on macOS with iMessage
- **Read-only** - Database is opened in read-only mode for safety
- **Permissions required** - Full Disk Access is mandatory
- **Performance** - Uses efficient SQL queries with proper JOINs

```bash
bun run src/index.ts
```

This project was created using `bun init` in bun v1.2.21. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
