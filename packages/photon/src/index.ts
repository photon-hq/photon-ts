export { App } from "./core/app.ts";
export type { Target } from "./target.ts";

export { GatewayClient as Gateway } from "./gateway/client.ts";
export * from "./gateway/types";
export * from "./modifiers";
export * from "./types";

import "./core/extension.ts";
import "./modifiers/setup/attach.ts";
