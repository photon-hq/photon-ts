import { aware } from "../utils";
import type { Context } from "./context";

export type Invokable = (
    context: Context,
    values: any,
) => Promise<{
    context: Context;
    returnValues: any;
}>;

export function buildInvokbale(runner: (values: any) => Promise<any>): Invokable {
    return async (_context_, values) => {
        const context = _context_;

        const returnValues = await aware(context, async () => {
            return await runner(values);
        });

        return {
            context,
            returnValues,
        };
    };
}
