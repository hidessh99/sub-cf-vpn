import { z } from "zod";

export const CreateDomainRequestSchema = z.object({
  domain: z.string({ required_error: "Domain name is required" }).min(1, "Domain name cannot be empty").toLowerCase().trim(),
});

export type CreateDomainRequest = z.infer<typeof CreateDomainRequestSchema>;
