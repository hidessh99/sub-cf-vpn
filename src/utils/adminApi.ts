import { ApiResponse } from "../types/admin";

export async function adminFetch<T = ApiResponse<any>>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("admin_token");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      window.location.hash = "/admin/login";
      throw new Error("Session expired. Please login again.");
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json() as T;
      
      // We can check if it conforms to ApiResponse interface
      const dataObj = data as any;
      if (!response.ok) {
        throw new Error(dataObj?.message || "Request failed");
      }
      return data;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      message: "Request completed",
      data: null
    } as any as T;
  } catch (error: any) {
    console.error("API Fetch Error:", error);
    throw error;
  }
}
