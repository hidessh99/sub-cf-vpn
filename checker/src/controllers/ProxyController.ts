import { Context } from "hono";
import { IProxyUseCase } from "../usecases/interfaces";
import { checkProxy } from "../utils/checkProxy";
import { CreateProxyRequest, UpdateProxyRequest, ImportProxyItem } from "../dto/proxy.dto";
import { logger } from "../utils/logger";
import { isPrivateIP } from "../utils/ipValidator";

export class ProxyController {
  constructor(private proxyUseCase: IProxyUseCase) {}

  async getProxies(c: Context): Promise<Response> {
    let page = parseInt(c.req.query("page") || "1", 10);
    let limit = parseInt(c.req.query("limit") || "10", 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const search = c.req.query("search") || undefined;
    const country = c.req.query("country") || undefined;
    
    const isActiveParam = c.req.query("is_active");
    const is_active = (isActiveParam !== undefined && isActiveParam !== null) ? isActiveParam === "true" : undefined;

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
    const data = c.req.valid("json" as never) as CreateProxyRequest;
    const proxy = this.proxyUseCase.createProxy(data);
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
    const data = c.req.valid("json" as never) as UpdateProxyRequest;
    const proxy = this.proxyUseCase.updateProxy(id, data);
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
    this.proxyUseCase.deleteProxy(id);
    return c.json({
      success: true,
      message: "Proxy deleted successfully",
      data: null
    });
  }

  async importProxies(c: Context): Promise<Response> {
    const { proxies } = c.req.valid("json" as never) as { proxies: ImportProxyItem[] };
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

  async getPublicProxiesGrouped(c: Context): Promise<Response> {
    const list = this.proxyUseCase.getPublicProxyListGrouped();
    return c.json(list);
  }

  async syncHealth(c: Context): Promise<Response> {
    this.proxyUseCase.syncHealthCheck();
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
      logger.warn("checkProxies failed - no IP address list provided", "ProxyController");
      return c.json([]);
    }

    const list = ipsString.split(",").map(item => item.trim()).filter(Boolean);
    const tasks = list.map(async (item) => {
      const parts = item.split(":");
      const ip = parts[0];
      const port = parseInt(parts[1] || "443", 10);
      
      if (isPrivateIP(ip)) {
        logger.warn(`checkProxies blocked private IP range check: ${ip}:${port}`, "ProxyController");
        return { ip, port, proxyip: false, latency: 0 };
      }
      
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
      logger.warn("geoipLookup failed - IP address is missing", "ProxyController");
      return c.json({ success: false, message: "IP address parameter is required", error: null }, 400);
    }

    if (isPrivateIP(ip as string)) {
      logger.warn(`geoipLookup blocked private IP range lookup: ${ip}`, "ProxyController");
      return c.json({ success: false, message: "Invalid public IP address", error: null }, 400);
    }

    const data = await this.proxyUseCase.lookupGeoIP(ip as string);
    return c.json({
      success: true,
      message: "GeoIP lookup successful",
      data
    });
  }
}
