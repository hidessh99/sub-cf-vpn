import { z } from "zod";

export const CreateProxyRequestSchema = z.object({
  proxy: z.string().optional(),
  port: z.string().optional(),
  proxyip: z.boolean().optional(),
  ip: z.string().min(1, "IP address is required"),
  latency: z.number().int().optional(),
  asn: z.number().int().nullable().optional(),
  as_organization: z.string().nullable().optional(),
  asOrganization: z.string().nullable().optional(),
  colo: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type CreateProxyRequest = z.infer<typeof CreateProxyRequestSchema>;

export const UpdateProxyRequestSchema = CreateProxyRequestSchema.partial();

export type UpdateProxyRequest = z.infer<typeof UpdateProxyRequestSchema>;

export const ImportProxyItemSchema = CreateProxyRequestSchema;

export type ImportProxyItem = z.infer<typeof ImportProxyItemSchema>;

export const ImportProxyListSchema = z.object({
  proxies: z.array(ImportProxyItemSchema)
});
