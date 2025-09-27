export type { Target } from "./target.ts";
export { App } from "./core/app.ts";
export { GatewayClient as Gateway } from "./gateway/client.ts";
export * from "./gateway/types";
export * from "./types";
// Centralized augmentation and runtime attach
import "./modifiers/extension.ts";
import "./modifiers/setup/attach.ts";
export { onboardModifier } from "./modifiers/onboard.ts";
export { sendModifier } from "./modifiers/send.ts";
export { promptModifier } from "./modifiers/prompt.ts";
