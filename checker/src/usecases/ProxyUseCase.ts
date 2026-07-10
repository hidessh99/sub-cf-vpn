import { ProxyRepository } from "../repositories/ProxyRepository";
import { ProxyIP } from "../models/ProxyIP";
import { CreateProxyRequest, UpdateProxyRequest, ImportProxyItem } from "../dto/proxy.dto";
import { PublicProxyItem } from "../dto/response.dto";

export class ProxyUseCase {
  private proxyRepo = new ProxyRepository();

  getAllProxies(
    page: number,
    limit: number,
    filters: { country?: string; is_active?: boolean; search?: string } = {}
  ): { data: ProxyIP[]; total: number } {
    return this.proxyRepo.findAll(page, limit, filters);
  }

  createProxy(data: CreateProxyRequest): ProxyIP {
    if (!data.ip) throw new Error("IP field is required");
    const proxyVal = data.proxy || data.ip;
    const portVal = String(data.port || "443");

    return this.proxyRepo.create({
      proxy: String(proxyVal),
      port: portVal,
      proxyip: data.proxyip !== undefined ? Boolean(data.proxyip) : true,
      ip: String(data.ip),
      latency: data.latency !== undefined ? Number(data.latency) : 0,
      asn: data.asn ? Number(data.asn) : null,
      as_organization: data.as_organization || data.asOrganization || null,
      colo: data.colo || null,
      country: data.country || null,
      city: data.city || null,
      region: data.region || null,
      postal_code: data.postal_code || data.postalCode || null,
      latitude: data.latitude ? String(data.latitude) : null,
      longitude: data.longitude ? String(data.longitude) : null,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    });
  }

  updateProxy(id: number, data: UpdateProxyRequest): ProxyIP {
    const existing = this.proxyRepo.findById(id);
    if (!existing) {
      throw new Error("Proxy not found");
    }

    const payload: Partial<ProxyIP> = {};
    if (data.proxy !== undefined) payload.proxy = String(data.proxy);
    if (data.port !== undefined) payload.port = String(data.port);
    if (data.proxyip !== undefined) payload.proxyip = Boolean(data.proxyip);
    if (data.ip !== undefined) payload.ip = String(data.ip);
    if (data.latency !== undefined) payload.latency = Number(data.latency);
    if (data.asn !== undefined) payload.asn = data.asn ? Number(data.asn) : null;
    if (data.as_organization !== undefined) payload.as_organization = data.as_organization;
    if (data.asOrganization !== undefined) payload.as_organization = data.asOrganization;
    if (data.colo !== undefined) payload.colo = data.colo;
    if (data.country !== undefined) payload.country = data.country;
    if (data.city !== undefined) payload.city = data.city;
    if (data.region !== undefined) payload.region = data.region;
    if (data.postal_code !== undefined) payload.postal_code = data.postal_code;
    if (data.postalCode !== undefined) payload.postal_code = data.postalCode;
    if (data.latitude !== undefined) payload.latitude = data.latitude ? String(data.latitude) : null;
    if (data.longitude !== undefined) payload.longitude = data.longitude ? String(data.longitude) : null;
    if (data.is_active !== undefined) payload.is_active = Boolean(data.is_active);

    return this.proxyRepo.update(id, payload);
  }

  deleteProxy(id: number): void {
    const existing = this.proxyRepo.findById(id);
    if (!existing) {
      throw new Error("Proxy not found");
    }
    this.proxyRepo.delete(id);
  }

  importFromJSON(list: ImportProxyItem[]): number {
    if (!Array.isArray(list)) {
      throw new Error("Import data must be a JSON array");
    }

    const formatted = list.map((item: ImportProxyItem) => {
      if (!item.ip) {
        throw new Error("Missing required field 'ip' in import items");
      }
      return {
        proxy: String(item.proxy || item.ip),
        port: String(item.port || "443"),
        proxyip: item.proxyip !== undefined ? Boolean(item.proxyip) : true,
        ip: String(item.ip),
        latency: item.latency !== undefined ? Number(item.latency) : 0,
        asn: item.asn ? Number(item.asn) : null,
        as_organization: item.as_organization || item.asOrganization || null,
        colo: item.colo || null,
        country: item.country || null,
        city: item.city || null,
        region: item.region || null,
        postal_code: item.postal_code || item.postalCode || null,
        latitude: item.latitude ? String(item.latitude) : null,
        longitude: item.longitude ? String(item.longitude) : null,
        is_active: true,
      };
    });

    return this.proxyRepo.bulkCreate(formatted);
  }

  getPublicProxyList(): PublicProxyItem[] {
    return this.proxyRepo.getPublicList();
  }
}
