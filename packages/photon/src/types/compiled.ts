import { z } from "zod";

export const compiledPhotonSchema = z.object({
    name: z.string(),
    description: z.string(),
    onboard: z.object({}).strip().optional(),
});

export type CompiledPhoton = z.infer<typeof compiledPhotonSchema>;
