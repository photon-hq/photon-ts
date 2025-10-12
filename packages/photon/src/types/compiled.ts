import { z } from "zod";
import { preAction } from "./pre-action";

export const compiledPhotonSchema = z.object({
    name: z.string(),
    description: z.string(),
    preActions: z.record(z.string(), preAction),
});

export type CompiledPhoton = z.infer<typeof compiledPhotonSchema>;
