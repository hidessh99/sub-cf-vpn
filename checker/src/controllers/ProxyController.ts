import { ProxyUseCase } from "../usecases/ProxyUseCase";
import { successResponse, paginatedResponse, jsonResponse } from "../utils/response";
import { AuthContext } from "../middlewares/authMiddleware";
import { CreateProxyRequestSchema, UpdateProxyRequestSchema, ImportProxyListSchema } from "../dto/proxy.dto";
import { runHealthCheck } from "../cron/proxyHealthCheck";
import { checkProxy } from "../utils/checkProxy";
import { ValidationError, UnauthorizedError } from "../utils/errors";

export class ProxyController {
  constructor(private proxyUseCase: ProxyUseCase) {}

  async getProxies(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) throw new UnauthorizedError("Unauthorized");

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const search = url.searchParams.get("search") || undefined;
    const country = url.searchParams.get("country") || undefined;
    
    const isActiveParam = url.searchParams.get("is_active");
    const is_active = isActiveParam !== null ? isActiveParam === "true" : undefined;

    const result = this.proxyUseCase.getAllProxies(page, limit, { country, is_active, search });
    return paginatedResponse(result.data, result.total, page, limit);
  }

  async createProxy(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) throw new UnauthorizedError("Unauthorized");

    const body = await request.json().catch(() => ({}));
    const parsed = CreateProxyRequestSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
      throw new ValidationError(msg);
    }

    const proxy = this.proxyUseCase.createProxy(parsed.data);
    return successResponse(proxy, "Proxy created successfully", 201);
  }

  async updateProxy(id: number, request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) throw new UnauthorizedError("Unauthorized");

    const body = await request.json().catch(() => ({}));
    const parsed = UpdateProxyRequestSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
      throw new ValidationError(msg);
    }

    const proxy = this.proxyUseCase.updateProxy(id, parsed.data);
    return successResponse(proxy, "Proxy updated successfully");
  }

  async deleteProxy(id: number, admin: AuthContext | null): Promise<Response> {
    if (!admin) throw new UnauthorizedError("Unauthorized");
    this.proxyUseCase.deleteProxy(id);
    return successResponse(null, "Proxy deleted successfully");
  }

  async importProxies(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) throw new UnauthorizedError("Unauthorized");

    const body = await request.json().catch(() => []);
    const parsed = ImportProxyListSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => `[Item ${e.path.join(".")}]: ${e.message}`).join(", ");
      throw new ValidationError(`Invalid import format: ${msg}`);
    }

    const count = this.proxyUseCase.importFromJSON(parsed.data);
    return successResponse({ imported: count }, `Successfully imported ${count} proxies`);
  }

  async getPublicProxies(): Promise<Response> {
    const list = this.proxyUseCase.getPublicProxyList();
    return jsonResponse(list);
  }

  async PublicProxi(): Promise<Response> {
    const list = this.proxyUseCase.getPublicProxyListGrouped();
    return jsonResponse(list);
  }

  async syncHealth(admin: AuthContext | null): Promise<Response> {
    if (!admin) throw new UnauthorizedError("Unauthorized");
    runHealthCheck();
    return successResponse(null, "Proxy health check started in the background");
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
    if (!admin) throw new UnauthorizedError("Unauthorized");

    const url = new URL(request.url);
    const ip = url.searchParams.get("ip");
    if (!ip) {
      throw new ValidationError("IP address parameter is required");
    }

    const data = await this.proxyUseCase.lookupGeoIP(ip);
    return successResponse(data, "GeoIP lookup successful");
  }
}
