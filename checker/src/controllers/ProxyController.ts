import { Context } from "hono";
import { ProxyUseCase } from "../usecases/ProxyUseCase";
import { runHealthCheck } from "../cron/proxyHealthCheck";
import { checkProxy } from "../utils/checkProxy";
import { CreateProxyRequest, UpdateProxyRequest, ImportProxyItem } from "../dto/proxy.dto";

export class ProxyController {
  constructor(private proxyUseCase: ProxyUseCase) {}

  async getProxies(c: Context): Promise<Response> {
    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = parseInt(c.req.query("limit") || "10", 10);
    const search = c.req.query("search") || undefined;
    const country = c.req.query("country") || undefined;
    
    const isActiveParam = c.req.query("is_active");
    const is_active = isActiveParam !== null ? isActiveParam === "true" : undefined;

    const result = this.proxyUseCase.getAllProxies(page, limit, { country, is_active, search });
    
    const totalPages = Math.ceil(result.total / limit);
    return c.json({
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      }
    });
  }

  async createProxy(c: Context): Promise<Response> {
    const data = (c.req.valid as any)("json") as CreateProxyRequest;
    const proxy = this.proxyUseCase.createProxy(data);
    return c.json({
      success: true,
      message: "Proxy created successfully",
      data: proxy
    }, 201);
  }

  async updateProxy(c: Context): Promise<Response> {
    const id = parseInt(c.req.param("id"), 10);
    const data = (c.req.valid as any)("json") as UpdateProxyRequest;
    const proxy = this.proxyUseCase.updateProxy(id, data);
    return c.json({
      success: true,
      message: "Proxy updated successfully",
      data: proxy
    });
  }

  async deleteProxy(c: Context): Promise<Response> {
    const id = parseInt(c.req.param("id"), 10);
    this.proxyUseCase.deleteProxy(id);
    return c.json({
      success: true,
      message: "Proxy deleted successfully",
      data: null
    });
  }

  async importProxies(c: Context): Promise<Response> {
    const { proxies } = (c.req.valid as any)("json") as { proxies: ImportProxyItem[] };
    const count = this.proxyUseCase.importFromJSON(proxies);
    return c.json({
      success: true,
      message: `Successfully imported ${count} proxies`,
      data: { imported: count }
    });
  }

  async getPublicProxies(c: Context): Promise<Response> {
    const list = this.proxyUseCase.getPublicProxyList();
    return c.json(list);
  }

  async PublicProxi(c: Context): Promise<Response> {
    const list = this.proxyUseCase.getPublicProxyListGrouped();
    return c.json(list);
  }

  async syncHealth(c: Context): Promise<Response> {
    runHealthCheck();
    return c.json({
      success: true,
      message: "Proxy health check started in the background",
      data: null
    });
  }

  async checkProxies(c: Context): Promise<Response> {
    let ipsString = c.req.query("ips") || c.req.query("ip") || "";
    if (!ipsString) {
      const paramIps = c.req.param("ips");
      if (paramIps) {
        ipsString = decodeURIComponent(paramIps);
      }
    }

    if (!ipsString) {
      return c.json([]);
    }

    const list = ipsString.split(",").map(item => item.trim()).filter(Boolean);
    const tasks = list.map(item => {
      const parts = item.split(":");
      const ip = parts[0];
      const port = parseInt(parts[1] || "443", 10);
      return checkProxy(ip, port, 2500);
    });

    const results = await Promise.all(tasks);
    c.header("Content-Type", "application/json");
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Cache-Control", "no-cache, no-store, must-revalidate");
    return c.json(results);
  }

  async geoipLookup(c: Context): Promise<Response> {
    const ip = c.req.query("ip");
    if (!ip) {
      return c.json({ success: false, message: "IP address parameter is required", error: null }, 400);
    }

    const data = await this.proxyUseCase.lookupGeoIP(ip);
    return c.json({
      success: true,
      message: "GeoIP lookup successful",
      data
    });
  }
}
