export interface PublicProxyItem {
  proxy: string;
  port: string;
  proxyip: boolean;
  ip: string;
  latency: number;
  asn: number | null;
  asOrganization: string | null;
  colo: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
}
