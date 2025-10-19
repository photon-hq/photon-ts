import { AsyncLocalStorage } from "node:async_hooks";
import type { Context } from "../core/context";

const als = new AsyncLocalStorage<Context>();

export function aware(context: Context | null = null, handler: (context: Context) => void) {
    if (context) {
        als.run(context, () => {
            handler(context);
        })
        
        return
    }
    
    const als_context = als.getStore();
    
    if (als_context) {
        handler(als_context);
        
        return
    }
    
    throw new Error("No context available");
}