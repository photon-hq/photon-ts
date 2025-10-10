import { AppInstance } from "./app-instance.ts";
import { registry } from "./registry.ts";
import type { SomeModifier } from "./some-modifier.ts";

for (const key of Object.keys(registry)) {
    const entry = (registry as any)[key];
    if (entry.mode === "modifier") {
        (AppInstance.prototype as any)[key] = function (this: AppInstance<any, any, any>, ...args: unknown[]) {
            const mod = entry.create(...args) as SomeModifier<any, any>;
            return mod.main(this)
        };
    }
}
