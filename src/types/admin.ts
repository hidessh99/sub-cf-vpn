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
