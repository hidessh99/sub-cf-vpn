export interface AdminRow {
  id: number;
  username: string;
  password?: string;
  created_at: string;
  updated_at: string;
}

export interface BugRow {
  id: number;
  hostname: string;
  is_active: number;
  created_at: string;
}

export interface DomainRow {
  id: number;
  domain: string;
  is_active: number;
  created_at: string;
}

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

export interface CountRow {
  count: number;
}

export interface IdRow {
  id: number;
}
