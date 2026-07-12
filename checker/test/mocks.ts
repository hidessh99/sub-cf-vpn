import { IAdminRepository, IBugRepository, IDomainRepository, IProxyRepository } from "../src/repositories/interfaces";
import { Admin } from "../src/models/Admin";
import { Bug } from "../src/models/Bug";
import { Domain } from "../src/models/Domain";
import { ProxyIP } from "../src/models/ProxyIP";
import { PublicProxyItem } from "../src/dto/response.dto";

export class MockAdminRepository implements IAdminRepository {
  public db: Admin[] = [];

  findByUsername(username: string): Admin | null {
    return this.db.find(a => a.username === username) || null;
  }

  findById(id: number): Admin | null {
    return this.db.find(a => a.id === id) || null;
  }

  updatePassword(id: number, newHashedPassword: string): void {
    const admin = this.db.find(a => a.id === id);
    if (admin) {
      admin.password = newHashedPassword;
      admin.updated_at = new Date().toISOString();
    }
  }
}

export class MockBugRepository implements IBugRepository {
  public db: Bug[] = [];

  findAll(): Bug[] {
    return [...this.db].sort((a, b) => b.id - a.id);
  }

  findByHostname(hostname: string): Bug | null {
    return this.db.find(b => b.hostname === hostname) || null;
  }

  create(hostname: string): Bug {
    const bug: Bug = {
      id: this.db.length + 1,
      hostname,
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.db.push(bug);
    return bug;
  }

  delete(id: number): void {
    this.db = this.db.filter(b => b.id !== id);
  }

  bulkCreate(bugs: string[]): number {
    let count = 0;
    for (const b of bugs) {
      const clean = b.trim().toLowerCase();
      if (clean && !this.findByHostname(clean)) {
        this.create(clean);
        count++;
      }
    }
    return count;
  }

  getPublicList(): string[] {
    return this.db.filter(b => b.is_active).map(b => b.hostname);
  }

  count(): number {
    return this.db.length;
  }
}

export class MockDomainRepository implements IDomainRepository {
  public db: Domain[] = [];

  findAll(): Domain[] {
    return [...this.db].sort((a, b) => b.id - a.id);
  }

  findByDomain(domain: string): Domain | null {
    return this.db.find(d => d.domain === domain) || null;
  }

  create(domain: string): Domain {
    const newDomain: Domain = {
      id: this.db.length + 1,
      domain,
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.db.push(newDomain);
    return newDomain;
  }

  delete(id: number): void {
    this.db = this.db.filter(d => d.id !== id);
  }

  bulkCreate(domains: string[]): number {
    let count = 0;
    for (const d of domains) {
      const clean = d.trim().toLowerCase();
      if (clean && !this.findByDomain(clean)) {
        this.create(clean);
        count++;
      }
    }
    return count;
  }

  getPublicList(): string[] {
    return this.db.filter(d => d.is_active).map(d => d.domain);
  }

  count(): number {
    return this.db.length;
  }
}

export class MockProxyRepository implements IProxyRepository {
  public db: ProxyIP[] = [];

  findAll(
    page: number,
    limit: number,
    filters: { country?: string; is_active?: boolean; search?: string } = {}
  ): { data: ProxyIP[]; total: number } {
    let list = this.db;

    if (filters.country) {
      list = list.filter(p => p.country === filters.country);
    }

    if (filters.is_active !== undefined) {
      list = list.filter(p => p.is_active === filters.is_active);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      list = list.filter(p =>
        p.ip.toLowerCase().includes(searchLower) ||
        p.proxy.toLowerCase().includes(searchLower) ||
        (p.country && p.country.toLowerCase().includes(searchLower)) ||
        (p.as_organization && p.as_organization.toLowerCase().includes(searchLower))
      );
    }

    const total = list.length;
    const start = (page - 1) * limit;
    const data = list.slice(start, start + limit);

    return { data, total };
  }

  findById(id: number): ProxyIP | null {
    return this.db.find(p => p.id === id) || null;
  }

  create(p: Omit<ProxyIP, "id" | "created_at" | "updated_at">): ProxyIP {
    const proxy: ProxyIP = {
      id: this.db.length + 1,
      ...p,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.push(proxy);
    return proxy;
  }

  update(id: number, p: Partial<ProxyIP>): ProxyIP {
    const index = this.db.findIndex(item => item.id === id);
    if (index === -1) throw new Error("Proxy not found");
    this.db[index] = {
      ...this.db[index],
      ...p,
      updated_at: new Date().toISOString()
    };
    return this.db[index];
  }

  delete(id: number): void {
    this.db = this.db.filter(p => p.id !== id);
  }

  bulkCreate(proxies: Omit<ProxyIP, "id" | "created_at" | "updated_at">[]): number {
    proxies.forEach(p => this.create(p));
    return proxies.length;
  }

  getPublicList(): PublicProxyItem[] {
    return this.db.filter(p => p.is_active).map(p => ({
      proxy: p.proxy,
      port: p.port,
      proxyip: p.proxyip,
      ip: p.ip,
      latency: p.latency,
      asn: p.asn,
      asOrganization: p.as_organization,
      colo: p.colo,
      country: p.country,
      city: p.city,
      region: p.region,
      postalCode: p.postal_code,
      latitude: p.latitude,
      longitude: p.longitude
    }));
  }

  count(): number {
    return this.db.length;
  }

  findAllActive(): ProxyIP[] {
    return this.db.filter(p => p.is_active);
  }

  bulkDelete(ids: number[]): number {
    const originalCount = this.db.length;
    this.db = this.db.filter(p => !ids.includes(p.id));
    return originalCount - this.db.length;
  }
}

import { IGeoIPService, GeoIPResult } from "../src/services/GeoIPService";

export class MockGeoIPService implements IGeoIPService {
  async lookup(ip: string): Promise<GeoIPResult> {
    return {
      success: true,
      country_code: "US",
      city: "Mountain View",
      region: "California",
      postal: "94043",
      latitude: "37.422",
      longitude: "-122.084",
      connection: {
        asn: 15169,
        org: "Google LLC"
      }
    };
  }
}
