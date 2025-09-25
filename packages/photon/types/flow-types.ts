import {z} from "zod";

export const flowTypeSchema = z.enum(["send", "tell"]);

export type FlowType = z.infer<typeof flowTypeSchema>;