import { z } from "zod";

export const CreateBugRequestSchema = z.object({
  hostname: z.string().min(1, "Hostname is required").toLowerCase().trim(),
});

export type CreateBugRequest = z.infer<typeof CreateBugRequestSchema>;
