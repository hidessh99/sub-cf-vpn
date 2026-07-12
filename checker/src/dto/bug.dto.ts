import { z } from "zod";

export const CreateBugRequestSchema = z.object({
  hostname: z.string({ required_error: "Hostname is required" }).min(1, "Hostname cannot be empty").toLowerCase().trim(),
});

export type CreateBugRequest = z.infer<typeof CreateBugRequestSchema>;
