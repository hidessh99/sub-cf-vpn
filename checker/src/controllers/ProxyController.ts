import { ProxyUseCase } from "../usecases/ProxyUseCase";
import { successResponse, errorResponse, paginatedResponse, jsonResponse } from "../utils/response";
import { AuthContext } from "../middlewares/authMiddleware";
import { CreateProxyRequest, UpdateProxyRequest, ImportProxyItem } from "../dto/proxy.dto";
import { runHealthCheck } from "../cron/proxyHealthCheck";
import { checkProxy } from "../utils/checkProxy";

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

  async syncHealth(admin: AuthContext | null): Promise<Response> {
    if (!admin) return errorResponse("Unauthorized", 401);

    try {
      // Trigger the health check cycle in the background
      runHealthCheck();
      return successResponse(null, "Proxy health check started in the background");
    } catch (e: any) {
      return errorResponse(e.message || "Failed to start health check", 400);
    }
  }

  async checkProxies(request: Request): Promise<Response> {
    const url = new URL(request.url);
    let ipsString = url.searchParams.get('ips') || url.searchParams.get('ip') || '';
    if (!ipsString && url.pathname.startsWith('/api/check/')) {
      ipsString = decodeURIComponent(url.pathname.replace('/api/check/', ''));
    }

    if (!ipsString) {
      return jsonResponse([]);
    }

    const list = ipsString.split(',').map(item => item.trim()).filter(Boolean);
    const tasks = list.map(item => {
      const parts = item.split(':');
      const ip = parts[0];
      const port = parseInt(parts[1] || '443', 10);
      return checkProxy(ip, port, 2500);
    });

    const results = await Promise.all(tasks);
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }

  async geoipLookup(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) return errorResponse("Unauthorized", 401);

    const url = new URL(request.url);
    const ip = url.searchParams.get("ip");
    if (!ip) {
      return errorResponse("IP address parameter is required", 400);
    }

    try {
      const data = await this.proxyUseCase.lookupGeoIP(ip);
      return successResponse(data, "GeoIP lookup successful");
    } catch (e: any) {
      return errorResponse(e.message || "GeoIP lookup failed", 400);
    }
  }
}
