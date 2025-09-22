import {FlowTypeSchema} from "./flow-types.ts";
import {z} from "zod";

export const CompiledPhotonSchema = z.object({
    onboard: z.object({
        flow: z.array(z.object({
            type: FlowTypeSchema
        }).loose())
    }).optional()
}).strip()

export type CompiledPhoton = z.infer<typeof CompiledPhotonSchema>;