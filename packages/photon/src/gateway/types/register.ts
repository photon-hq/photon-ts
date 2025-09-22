import { z } from 'zod';
import {CompiledPhotonSchema} from "../../types/compiled-photon.ts";

export const registerSchema = z.object({
    apiKey: z.string(),
    photon: CompiledPhotonSchema
})

export type Register = z.infer<typeof registerSchema>;