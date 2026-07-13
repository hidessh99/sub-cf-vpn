import { ApiResponse } from "../types";
import { AuthService } from "../services/AuthService";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = AuthService.getToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    AuthService.clearSession();
    window.location.hash = "/admin/login";
    throw new ApiError("Session expired. Please login again.", 401);
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data: unknown = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = (data && typeof data === 'object' && 'message' in data)
      ? String((data as Record<string, unknown>).message)
      : `HTTP error! Status: ${response.status}`;
    throw new ApiError(errorMsg, response.status);
  }

  return data as T;
}
