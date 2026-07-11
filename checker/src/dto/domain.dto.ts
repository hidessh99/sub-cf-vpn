import { z } from "zod";

export const CreateDomainRequestSchema = z.object({
  domain: z.string().min(1, "Domain name is required").toLowerCase().trim(),
});

export type CreateDomainRequest = z.infer<typeof CreateDomainRequestSchema>;
