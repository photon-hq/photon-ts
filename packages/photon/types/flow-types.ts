import {z} from "zod";

export const FlowTypeSchema = z.enum(["send", "tell"]);

export type FlowType = z.infer<typeof FlowTypeSchema>;