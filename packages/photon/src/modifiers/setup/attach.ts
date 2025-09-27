import { App } from "../../core/app.ts";
import { registry } from "./registry.ts";

for (const key of Object.keys(registry)) {
    const entry = (registry as any)[key];
    if (entry.mode === "modifier") {
        (App.prototype as any)[key] = function (this: App<any, any, any>, ...args: unknown[]) {
            const mod = entry.create(...args);
            return (this as any).modifier(mod);
        };
    } else if (entry.mode === "base") {
        (App.prototype as any)[key] = function (this: App<any, any, any>) {
            const mod = entry.create();
            return (this as any).baseModifier(mod);
        };
    }
}
