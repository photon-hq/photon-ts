import { flowStepSchema } from "../modifiers/setup/type.ts";
import { z } from "zod";

export const compiledPhotonSchema = z
    .object({
        onboard: z
            .object({
                flow: z.array(flowStepSchema),
            })
            .optional(),
    })
    .strip();

export type CompiledPhoton = z.infer<typeof compiledPhotonSchema>;
