import { ProxyUseCase } from "../usecases/ProxyUseCase";
import { successResponse, errorResponse, paginatedResponse, jsonResponse } from "../utils/response";
import { AuthContext } from "../middlewares/authMiddleware";
import { CreateProxyRequest, UpdateProxyRequest, ImportProxyItem } from "../dto/proxy.dto";

export class ProxyController {
  private proxyUseCase = new ProxyUseCase();

  async getProxies(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) return errorResponse("Unauthorized", 401);

    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get("page") || "1", 10);
      const limit = parseInt(url.searchParams.get("limit") || "10", 10);
      const search = url.searchParams.get("search") || undefined;
      const country = url.searchParams.get("country") || undefined;
      
      const isActiveParam = url.searchParams.get("is_active");
      const is_active = isActiveParam !== null ? isActiveParam === "true" : undefined;

      const result = this.proxyUseCase.getAllProxies(page, limit, { country, is_active, search });
      return paginatedResponse(result.data, result.total, page, limit);
    } catch (e: any) {
      return errorResponse(e.message || "Failed to fetch proxies", 400);
    }
  }

  async createProxy(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) return errorResponse("Unauthorized", 401);

    try {
      const body = await request.json() as CreateProxyRequest;
      const proxy = this.proxyUseCase.createProxy(body);
      return successResponse(proxy, "Proxy created successfully", 201);
    } catch (e: any) {
      return errorResponse(e.message || "Failed to create proxy", 400);
    }
  }

  async updateProxy(id: number, request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) return errorResponse("Unauthorized", 401);

    try {
      const body = await request.json() as UpdateProxyRequest;
      const proxy = this.proxyUseCase.updateProxy(id, body);
      return successResponse(proxy, "Proxy updated successfully");
    } catch (e: any) {
      return errorResponse(e.message || "Failed to update proxy", 400);
    }
  }

  async deleteProxy(id: number, admin: AuthContext | null): Promise<Response> {
    if (!admin) return errorResponse("Unauthorized", 401);

    try {
      this.proxyUseCase.deleteProxy(id);
      return successResponse(null, "Proxy deleted successfully");
    } catch (e: any) {
      return errorResponse(e.message || "Failed to delete proxy", 400);
    }
  }

  async importProxies(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) return errorResponse("Unauthorized", 401);

    try {
      const body = await request.json();
      const list = (Array.isArray(body) ? body : [body]) as ImportProxyItem[];
      const count = this.proxyUseCase.importFromJSON(list);
      return successResponse({ imported: count }, `Successfully imported ${count} proxies`);
    } catch (e: any) {
      return errorResponse(e.message || "Failed to import proxies", 400);
    }
  }

  async getPublicProxies(): Promise<Response> {
    try {
      const list = this.proxyUseCase.getPublicProxyList();
      // Return raw array to match existing static proxyip.json
      return jsonResponse(list);
    } catch (e: any) {
      return errorResponse("Failed to fetch public proxies", 500);
    }
  }

  async PublicProxi(): Promise<Response> {
    try {
      const list = this.proxyUseCase.getPublicProxyListGrouped();
      return jsonResponse(list);
    } catch (e: any) {
      return errorResponse("Failed to fetch public grouped proxies", 500);
    }
  }
}
