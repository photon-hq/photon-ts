import { z } from "zod";

export const compiledPhotonSchema = z
    .object({
        onboard: z.object({}).optional(),
    })
    .strip();

export type CompiledPhoton = z.infer<typeof compiledPhotonSchema>;
