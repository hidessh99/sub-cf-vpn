import { ApiResponse } from "../types/admin";
import { apiClient } from "./apiClient";

export async function adminFetch<T = ApiResponse<any>>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return apiClient<T>(endpoint, options);
}
