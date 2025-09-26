import { z } from "zod";
import { flowStepSchema } from "./flow-types.ts";

export const compiledPhotonSchema = z
    .object({
        onboard: z
            .object({
                flow: z.array(flowStepSchema),
            })
            .optional(),
        tools: z.record(
            z.string(),
            z.object({
                description: z.string(),
                flow: z.array(flowStepSchema),
            }),
        ),
    })
    .strip();

export type CompiledPhoton = z.infer<typeof compiledPhotonSchema>;
