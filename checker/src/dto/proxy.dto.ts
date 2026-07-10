export interface CreateProxyRequest {
  proxy?: string;
  port?: string;
  proxyip?: boolean;
  ip: string;                    // required
  latency?: number;
  asn?: number | null;
  as_organization?: string | null;
  asOrganization?: string | null;  // camelCase variant
  colo?: string | null;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  postalCode?: string | null;      // camelCase variant
  latitude?: string | null;
  longitude?: string | null;
  is_active?: boolean;
}

export type UpdateProxyRequest = Partial<CreateProxyRequest>;

export type ImportProxyItem = CreateProxyRequest;
