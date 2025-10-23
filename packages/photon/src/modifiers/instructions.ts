import { aware } from "../utils";

export function instructions(...texts: string[]) {
    aware((context) => {
        context.agentConfig.instructions.push(...texts);
    });
}
