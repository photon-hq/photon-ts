import { z } from "zod";

const compiledPluginSchema = z.object({
    name: z.string(),
    type: z.enum(["base", "modifier"]).optional(),
    inputSchema: z.record(z.string(), z.any()),
    outputSchema: z.record(z.string(), z.any()),
});

export const compiledPhotonSchema = z.object({
    state: z.record(z.string(), z.any()),
    plugins: z.array(compiledPluginSchema),
});

export type CompiledPhoton = z.infer<typeof compiledPhotonSchema>;
