# Photon

[![npm version](https://img.shields.io/npm/v/@photon-ai/photon.svg)](https://www.npmjs.com/package/@photon-ai/photon)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**Build AI agents with 10x less code.**

Photon is an innovative framework for building AI agents across any platform. Instead of writing step-by-step instructions, you **declare what your agent should be**. Photon handles the rest.

**Why Photon?**

- ⚡ **Exceptionally simple** - Declare behavior, not logic
- 🌐 **Cross-platform** - One agent, any messaging app
- 🔄 **Stateful by default** - Per-user state, zero config
- 📦 **Type-safe** - Full TypeScript support
- 🎨 **Composable** - Reuse logic like Lego blocks

---

## Install

```bash
npm install photon zod
# or
bun add photon zod
```

---

## Quick Start

```typescript
import { $, instructions } from 'photon';

// Define agent
const agent = $(() => {
  instructions('You are a helpful assistant');
});

// Deploy
agent.deploy();
```

**Environment: `.env` or terminal**

```bash
export PROJECT_ID=my-project
export PROJECT_SECRET=my-secret
```

**Run:**

```bash
bun run agent.ts
```

**Done!** Your agent is now connected to Gateway. When a user sends a message (via a Target), Gateway will:
1. Call your `$()` function with user context
2. Use your instructions to generate an AI response
3. Send the response back to Target, which delivers it to the user

> **Note:** You also need a [Target](#targets-connect-to-messaging-platforms) to connect users to your agent. See [`packages/local-imessage`](./packages/local-imessage) for a complete example.

---

## Core Concepts

### `$()` - Define Agent Behavior

The `$()` function wraps your agent logic:

```typescript
const agent = $(() => {
  instructions('You are a travel expert');
  instructions('Keep answers under 50 words');
});
```

This function runs during initialization or when state changes to determine how your AI should behave.

---

### `instructions()` - System Prompts

Tell your AI how to behave:

```typescript
$(() => {
  instructions('You are a helpful assistant');
  instructions('Always be polite');
});
```

---

### `state()` - Per-User Persistent State

Store data for each user:

```typescript
import { state } from 'photon';
import { z } from 'zod';

$(() => {
  const language = state('language', z.string()).default('en');
  
  instructions(`Reply in ${language} language`);
  
  tool('change_language', (newLang: string) => {
    language.update(newLang);
    return `Language changed to ${newLang}`;
  });
});
```

**How it works:**
- Each user gets their own `language` state
- Value persists across messages
- AI can call `change_language` tool to update it
- Next message will use the new language

---

### Modifiers

**Modifiers** are declarative functions that configure how your AI thinks and responds. They modify the agent's configuration without executing actions.

**Examples:**
- `instructions()` - Set system prompts
- `model()` - Choose AI model

```typescript
$(() => {
  model('gpt-5');
  instructions('You are an expert');
});
```

---

### Tools & Actions

Tools allow your AI to interact with external systems. _(In development)_

```typescript
$(() => {
  tool('search', async (query: string) => {
    // Your tool implementation
    return searchResults;
  });
});
```

---

## Architecture

**Flow:**

```
User → Target → Gateway → Your $() Code → AI Response → Target → User
```

**Detailed flow when user sends "Hello":**

1. **User sends "Hello"** to your platform (e.g., iMessage)
2. **Your Target** receives it, forwards to Gateway
3. **Gateway** calls your `$()` function with user context
4. **Gateway** generates AI response using your instructions + AI model
5. **Gateway** sends response back to Target
6. **Target** delivers response to User

---

## Examples

### Example: Stateful AI Assistant

```typescript
import { $, instructions, state } from 'photon';
import { z } from 'zod';

const agent = $(() => {
  const language = state('language', z.string()).default('en');
  
  instructions('You are a helpful assistant');
  instructions(`Reply in ${language} language`);
});

agent.deploy();
```

**Environment:**

```bash
export PROJECT_ID=my-project
export PROJECT_SECRET=my-secret
```

**What this does:**

- Each user has their own `language` preference
- State persists across messages in Gateway's database
- AI will respond in the user's preferred language

---

## Targets (Connect to Messaging Platforms)

**What is a Target?**

A Target connects your agent to real users on messaging platforms (iMessage, WhatsApp, etc.).

- **Your Agent** - Defines behavior, tool calls, and actions
- **Target** - Handles messaging platform integration
- **Gateway** - Connects them together

### Basic Target Structure

```typescript
import { Target, type MessageContent } from 'photon';

class MyTarget extends Target {
  name = 'my-platform';
  
  async postStart() {
    // 1. Listen for incoming messages from your platform
    // 2. For each message:
    //    - Get Photon userId: await this.userId(platformUserId)
    //    - Forward to Gateway: await this.sendMessage(userId, content)
  }
  
  protected async onMessage(userId: string, message: MessageContent) {
    // 3. Receive AI response from Gateway
    // 4. Get platform userId: await this.externalId(userId)
    // 5. Send message back to your platform
  }
}
```

See [`packages/local-imessage`](./packages/local-imessage) for a complete working example.

---

### Target SDK

#### `abstract class Target`

Extend to connect messaging platforms.

**You must implement:**
- `name: string` - Platform identifier
- `postStart(): Promise<void>` - Setup logic (e.g., start webhook server)
- `onMessage(userId: string, message: MessageContent): Promise<void>` - Handle AI responses from Gateway

**Available methods:**

```typescript
// Send message to Gateway
await this.sendMessage(userId, {
  type: 'plain_text',
  content: 'Hello'
}, payload);  // payload is optional

// Get Photon user ID from platform user ID
const userId = await this.userId('platform-user-123');

// Get platform user ID from Photon user ID  
const externalId = await this.externalId(userId);
```

**Method signatures:**
```typescript
sendMessage(userId: string, content: MessageContent, payload?: any): Promise<void>
userId(externalId: string): Promise<string | null>
externalId(userId: string): Promise<string | null>
```

**Types:**
```typescript
type MessageContent = {
  type: 'plain_text';
  content: string;
}
```

---

## FAQ

**Q: Do I need to write AI response logic?**

No! You only define **instructions**. Gateway uses your instructions + AI model to generate responses automatically.

---

**Q: Where does state persist?**

Gateway's PostgreSQL database. Each user has isolated state per project.

---

**Q: How do I get PROJECT_ID and PROJECT_SECRET?**

Create a new project in the [Photon Console](https://console.photon.codes). 

---

## Example Target Implementation

See [`packages/local-imessage`](./packages/local-imessage) for a complete example of integrating iMessage with Photon.

---

## License

This project is licensed under the [MIT License](./LICENSE).
