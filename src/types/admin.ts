export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginResponseData {
  token: string;
  admin: {
    id: number;
    username: string;
    created_at: string;
    updated_at: string;
  };
}

export interface ProxyIP {
  id: number;
  proxy: string;
  port: string;
  proxyip: boolean;
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
  is_active: boolean;
}
