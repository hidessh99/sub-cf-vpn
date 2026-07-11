import { IProxyRepository } from "../repositories/interfaces";
import { ProxyIP } from "../models/ProxyIP";
import { CreateProxyRequest, UpdateProxyRequest, ImportProxyItem } from "../dto/proxy.dto";
import { PublicProxyItem } from "../dto/response.dto";
import { ValidationError, NotFoundError } from "../utils/errors";

export class ProxyUseCase {
  constructor(private proxyRepo: IProxyRepository) {}

  getAllProxies(
    page: number,
    limit: number,
    filters: { country?: string; is_active?: boolean; search?: string } = {}
  ): { data: ProxyIP[]; total: number } {
    return this.proxyRepo.findAll(page, limit, filters);
  }

  createProxy(data: CreateProxyRequest): ProxyIP {
    if (!data.ip) throw new ValidationError("IP field is required");
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
      throw new NotFoundError("Proxy not found");
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
      throw new NotFoundError("Proxy not found");
    }
    this.proxyRepo.delete(id);
  }

  importFromJSON(list: ImportProxyItem[]): number {
    if (!Array.isArray(list)) {
      throw new ValidationError("Import data must be a JSON array");
    }

    const formatted = list.map((item: ImportProxyItem) => {
      if (!item.ip) {
        throw new ValidationError("Missing required field 'ip' in import items");
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

  getPublicProxyListGrouped(): Record<string, string[]> {
    const list = this.proxyRepo.getPublicList();
    const grouped: Record<string, string[]> = {};
    for (const item of list) {
      const country = (item.country || "UNK").toUpperCase();
      if (!grouped[country]) {
        grouped[country] = [];
      }
      const proxyStr = `${item.proxy}:${item.port}`;
      grouped[country].push(proxyStr);
    }
    return grouped;
  }

  async lookupGeoIP(ip: string): Promise<any> {
    try {
      // Fetch from ipwho.is (Primary)
      const res = await fetch(`https://ipwho.is/${ip}`);
      if (!res.ok) {
        throw new Error("Failed to fetch geo data from primary provider");
      }
      const data = await res.json() as any;
      if (!data || data.success === false) {
        throw new Error(data?.message || "Invalid IP or lookup failed on primary provider");
      }
      return {
        success: true,
        country_code: data.country_code,
        city: data.city,
        region: data.region,
        postal: data.postal,
        latitude: data.latitude,
        longitude: data.longitude,
        connection: {
          asn: data.connection?.asn,
          org: data.connection?.org || data.connection?.isp
        }
      };
    } catch (e: any) {
      // Fallback: try freeipapi.com
      try {
        const backupRes = await fetch(`https://freeipapi.com/api/json/${ip}`);
        if (!backupRes.ok) {
          throw new Error("Failed to fetch geo data from backup provider");
        }
        const backupData = await backupRes.json() as any;
        return {
          success: true,
          country_code: backupData.countryCode,
          city: backupData.cityName,
          region: backupData.regionName,
          postal: backupData.zipCode,
          latitude: backupData.latitude,
          longitude: backupData.longitude,
          connection: {
            asn: backupData.asn,
            org: backupData.asName
          }
        };
      } catch (backupErr: any) {
        throw new ValidationError(e.message || "GeoIP lookup failed");
      }
    }
  }
}
