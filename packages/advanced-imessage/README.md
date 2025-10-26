# @photon/advanced-imessage

Advanced iMessage integration for Photon using `@sg-hq/advanced-imessage-kit`.

## Features

- Full iMessage integration with Private API support
- Real-time message monitoring
- Send messages programmatically
- Bidirectional communication with Photon Gateway
- Automatic user ID mapping

## Requirements

- macOS 10.13+ (Monterey+ recommended)
- Node.js v18.18.0+
- System Integrity Protection (SIP) disabled ⚠️
- Library Validation disabled ⚠️
- Full Disk Access enabled
- Messages.app logged in to iMessage

## Installation

```bash
# From workspace root
bun install
```

## Usage

```typescript
import { AdvancedIMessage } from "@photon/advanced-imessage";
import type { GatewayConfig } from "photon";

const target = new AdvancedIMessage();

const config: GatewayConfig = {
  url: "your-gateway-url",
  // ... other config
};

target.start(config);
```

## How It Works

1. **Message Reception**: Monitors iMessage database for new messages using advanced-imessage-kit
2. **User ID Mapping**: Automatically maps phone numbers/emails to Gateway user IDs
3. **Gateway Integration**: Forwards messages to Photon Gateway for processing
4. **Message Sending**: Receives messages from Gateway and sends via iMessage

## System Setup

This package requires disabling macOS security features. See the [advanced-imessage-kit README](https://github.com/sg-hq/advanced-imessage-kit#readme) for detailed setup instructions.

### Quick Setup

1. Disable Library Validation:
```bash
sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
```

2. Disable SIP (requires reboot into Recovery Mode):
```bash
csrutil disable
```

3. Grant Full Disk Access to your Terminal/application

## Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│   iMessage DB   │ ──────> │ Advanced SDK │ ──────> │   Gateway   │
│  (Messages.app) │ <────── │   (Target)   │ <────── │   (Photon)  │
└─────────────────┘         └──────────────┘         └─────────────┘
```

## License

MIT
