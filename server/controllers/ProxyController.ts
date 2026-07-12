import { Context } from "hono";
import { ProxyUseCase } from "../usecases/ProxyUseCase";
import { runHealthCheck } from "../cron/proxyHealthCheck";
import { CreateProxyRequest, UpdateProxyRequest, ImportProxyItem } from "../dto/proxy.dto";
import { logger } from "../utils/logger";

export class ProxyController {
  constructor(private proxyUseCase: ProxyUseCase) {}

  async getProxies(c: Context): Promise<Response> {
    let page = parseInt(c.req.query("page") || "1", 10);
    let limit = parseInt(c.req.query("limit") || "10", 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const search = c.req.query("search") || undefined;
    const country = c.req.query("country") || undefined;
    
    const isActiveParam = c.req.query("is_active");
    const is_active = (isActiveParam !== undefined && isActiveParam !== null) ? isActiveParam === "true" : undefined;

    const result = await this.proxyUseCase.getAllProxies(page, limit, { country, is_active, search });
    
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
    const proxy = await this.proxyUseCase.createProxy(data);
    return c.json({
      success: true,
      message: "Proxy created successfully",
      data: proxy
    }, 201);
  }

  async updateProxy(c: Context): Promise<Response> {
    const id = parseInt(c.req.param("id") || "", 10);
    if (isNaN(id)) {
      logger.warn(`updateProxy failed - invalid ID: ${c.req.param("id")}`, "ProxyController");
      return c.json({ success: false, message: "Invalid ID parameter", error: null }, 400);
    }
    const data = (c.req.valid as any)("json") as UpdateProxyRequest;
    const proxy = await this.proxyUseCase.updateProxy(id, data);
    return c.json({
      success: true,
      message: "Proxy updated successfully",
      data: proxy
    });
  }

  async deleteProxy(c: Context): Promise<Response> {
    const id = parseInt(c.req.param("id") || "", 10);
    if (isNaN(id)) {
      logger.warn(`deleteProxy failed - invalid ID: ${c.req.param("id")}`, "ProxyController");
      return c.json({ success: false, message: "Invalid ID parameter", error: null }, 400);
    }
    await this.proxyUseCase.deleteProxy(id);
    return c.json({
      success: true,
      message: "Proxy deleted successfully",
      data: null
    });
  }

  async importProxies(c: Context): Promise<Response> {
    const { proxies } = (c.req.valid as any)("json") as { proxies: ImportProxyItem[] };
    const count = await this.proxyUseCase.importFromJSON(proxies);
    return c.json({
      success: true,
      message: `Successfully imported ${count} proxies`,
      data: { imported: count }
    });
  }

  async getPublicProxies(c: Context): Promise<Response> {
    const list = await this.proxyUseCase.getPublicProxyList();
    return c.json(list);
  }

  async PublicProxi(c: Context): Promise<Response> {
    const list = await this.proxyUseCase.getPublicProxyListGrouped();
    return c.json(list);
  }

  async syncHealth(c: Context): Promise<Response> {
    c.executionCtx.waitUntil(runHealthCheck(c.env.DB, c.env));
    return c.json({
      success: true,
      message: "Proxy health check started in the background",
      data: null
    });
  }

  async geoipLookup(c: Context): Promise<Response> {
    const ip = c.req.query("ip");
    if (!ip) {
      logger.warn("geoipLookup failed - IP address is missing", "ProxyController");
      return c.json({ success: false, message: "IP address parameter is required", error: null }, 400);
    }

    const data = await this.proxyUseCase.lookupGeoIP(ip as string);
    return c.json({
      success: true,
      message: "GeoIP lookup successful",
      data
    });
  }
}
