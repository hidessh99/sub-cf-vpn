export interface ProxyRow {
  id: number;
  proxy: string;
  port: string;
  proxyip: number;        // SQLite INTEGER (0/1)
  ip: string;
  latency: number;
  asn: number | null;
  as_organization: string | null;
  colo: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  latitude: string | null;
  longitude: string | null;
  is_active: number;       // SQLite INTEGER (0/1)
  created_at: string;
  updated_at: string;
}
