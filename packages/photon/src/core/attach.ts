import { AppInstance } from "./app-instance.ts";
import { registry } from "./registry.ts";

for (const key of Object.keys(registry)) {
    const entry = (registry as any)[key];
    if (entry.mode === "modifier") {
        (AppInstance.prototype as any)[key] = function (this: AppInstance<any, any, any>, ...args: unknown[]) {
            const mod = entry.create(...args);
            return (this as any).modifier(mod);
        };
    }
}
