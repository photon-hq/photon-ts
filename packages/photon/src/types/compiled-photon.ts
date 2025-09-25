import {flowStepSchema} from "./flow-types.ts";
import {z} from "zod";

export const CompiledPhotonSchema = z.object({
    onboard: z.object({
        flow: z.array(flowStepSchema)
    }).optional()
}).strip()

export type CompiledPhoton = z.infer<typeof CompiledPhotonSchema>;