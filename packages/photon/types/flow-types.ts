import * as v from "valibot";

export const FlowTypeSchema = v.picklist(["send", "tell"]);

export type FlowType = v.InferInput<typeof FlowTypeSchema>;
