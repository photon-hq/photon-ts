import z from "zod";

const handoffOptionsSchema = z.object({});

export type HandoffOptions = z.infer<typeof handoffOptionsSchema>;
