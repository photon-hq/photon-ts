import * as v from "valibot";
import { CompiledPhotonSchema } from "../../types";

export const registerSchema = v.object({
  apiKey: v.string(),
  photon: CompiledPhotonSchema,
});

export type Register = v.InferOutput<typeof registerSchema>;
