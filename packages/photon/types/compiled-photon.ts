import { FlowTypeSchema } from "./flow-types.ts";
import * as v from "valibot";

export const CompiledPhotonSchema = v.object({
  onboard: v.optional(
    v.object({
      flow: v.array(
        v.object({
          type: FlowTypeSchema,
        })
      ),
    })
  ),
});

export type CompiledPhoton = v.InferInput<typeof CompiledPhotonSchema>;
