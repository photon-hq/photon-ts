# Photon

[![npm version](https://img.shields.io/npm/v/@photon-ai/photon.svg)](https://www.npmjs.com/package/@photon-ai/photon)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-SSPL-blue.svg)](./LICENSE)

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
3. Log the response (sending back to Target coming soon)

> **Note:** You also need a [Target](#targets-connect-to-messaging-platforms) to connect users to your agent. See below.

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

Every time a user sends a message, this function runs to determine how your AI should behave.

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
  const count = state('count', z.number()).default(0);
  
  instructions(`This user has sent ${count} messages`);
  
  count.update(count + 1);
});
```

**How it works:**
- Each user gets their own `count`
- Value persists across messages
- When `count.update()` is called, state is saved automatically

---

### `model()` - Choose AI Model

```typescript
import { model } from 'photon';

$(() => {
  model('gpt-4');
  instructions('Provide expert analysis');
});
```

---

## Architecture

**Simple view:**

```
User → Target → Gateway (IF no tool call, Your $() Code → AI Response) → Target → User
```

> ⚠️ **Current limitation:** AI responses are generated but not yet sent back to Target. See [Known Limitations](#known-limitations).

**Detailed flow when user sends "Hello":**

1. **User sends "Hello"** to your platform (e.g., iMessage)
2. **Your Target** receives it, forwards to Gateway
3. **Gateway** calls your `$()` function with user context
4. **Gateway** generates AI response using your instructions + AI model
5. **Gateway** sends response back to Target _(coming soon)_
6. **Target** delivers response to User _(coming soon)_

---

## Examples

### Basic Example

```typescript
import { $, instructions, state } from 'photon';
import { z } from 'zod';

// Define agent
const agent = $(() => {
  instructions('You are a helpful assistant');

  const count = state('count', z.number()).default(0);
  instructions(`This user has sent ${count} messages`);
  count.update(count + 1);
});

// Deploy
agent.deploy(new iMessage());
```

**Environment:**

```bash
export PROJECT_ID=my-project
export PROJECT_SECRET=my-secret
```

**Run:**

```bash
bun run agent.ts
```

---

### Complete Example: Subscription-Based AI Assistant

```typescript
import { $, instructions, model, state } from 'photon';
import { z } from 'zod';

const app = $(() => {
  const subscribe = state("subscribe", z.boolean()).default(false);
  
  if (!subscribe) {
    model("grok-4");
    instructions("You are xxxx.");
    
    tool("generate subscription link", () => {
      return generate_link();
    });
  } else {
    model("openai-gpt-5");
    instructions("You are xxxx.");
    
    tool("send email", send_email, {
      expect: z.object({...})
    });
    
    tool("reply email", reply_email, {
      expect: z.object({...})
    });
  }
});

on_stripe_webhook((status, user_id) => {
  if (status) {
    $scope(user_id, () => {
      const subscribe = state("subscribe", z.boolean()).default(false);
      subscribe.update(true);
    });
  }
});

app.deploy(new iMessage(), new WhatsApp());
```

**What this does:**

- **Non-subscribed users**: Use Grok-4 model with AI tool to generate subscription links
- **Subscribed users**: Use GPT-5 model with AI tools to send and reply to emails
- **Automatic subscription management**: Listen to Stripe webhooks and auto-update user subscription status on payment success
- **Multi-platform deployment**: Deploy simultaneously to iMessage and WhatsApp

---

## Targets (Connect to Messaging Platforms)

**What is a Target?**

A Target connects your agent to real users on messaging platforms (iMessage, WhatsApp, etc.).

- **Your Agent** - Defines behavior, tool calls, and actions
- **Target** - Handles messaging platform integration
- **Gateway** - Connects them together

### Basic Target Structure

```typescript
import { Target } from 'photon';

class MyTarget extends Target {
  name = 'my-platform';
  
  async postStart() {
    // 1. Listen for messages from your platform
    // 2. Convert platform user ID to Photon user ID
    // 3. Forward message to Gateway using this.sendMessage()
  }
}
```

---

### Target SDK

#### `abstract class Target`

Extend to connect messaging platforms.

**You must implement:**
- `name: string` - Platform identifier
- `postStart(): Promise<void>` - Setup logic (e.g., start webhook server)

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

## Known Limitations

**⚠️ Targets can't receive AI responses yet**

Your Target can SEND messages to Gateway, but can't RECEIVE AI responses back to forward to users. Gateway generates responses but only logs them.

**Status:** In development. Will be fixed in next release.

---

## License

This project is licensed under the [Server Side Public License v1 (SSPL)](./LICENSE) with additional restrictions.

### Prohibited Use

**You may NOT use this software to create competing products or services**, including but not limited to:
- AI agent frameworks or platforms
- Multi-platform agent deployment services
- Similar agent orchestration or state management tools

For the complete license terms, see the [LICENSE](./LICENSE) file.
