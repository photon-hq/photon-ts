import { z } from "zod";
import { compiledPhotonSchema } from "../../types";

export const registerSchema = z.object({
    apiKey: z.string(),
    photon: compiledPhotonSchema,
});

export type Register = z.infer<typeof registerSchema>;
