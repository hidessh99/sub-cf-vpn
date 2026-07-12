import { ProxyIP } from "../models/ProxyIP";
import { ProxyRow } from "../entities/ProxyEntity";
import { CountRow, IdRow } from "../entities/CommonEntity";
import { PublicProxyItem } from "../dto/response.dto";
import { IProxyRepository } from "./interfaces";

export class ProxyRepository implements IProxyRepository {
  constructor(private db: D1Database) {}

  async findAll(
    page: number,
    limit: number,
    filters: { country?: string; is_active?: boolean; search?: string } = {}
  ): Promise<{ data: ProxyIP[]; total: number }> {
    let baseQuery = "FROM proxies WHERE 1=1";
    const params: (string | number)[] = [];

    if (filters.country) {
      baseQuery += " AND country = ?";
      params.push(filters.country);
    }

    if (filters.is_active !== undefined) {
      baseQuery += " AND is_active = ?";
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.search) {
      baseQuery += " AND (ip LIKE ? OR proxy LIKE ? OR country LIKE ? OR as_organization LIKE ? OR colo LIKE ?)";
      const searchParam = `%${filters.search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as count ${baseQuery}`;
    const countResult = await this.db.prepare(countSql).bind(...params).first<CountRow>();
    const total = countResult ? countResult.count : 0;

    // Get paginated data
    const dataSql = `SELECT * ${baseQuery} ORDER BY id DESC LIMIT ? OFFSET ?`;
    const offset = (page - 1) * limit;
    const selectParams = [...params, limit, offset];
    
    const { results } = await this.db.prepare(dataSql).bind(...selectParams).all<ProxyRow>();
    const rows = results || [];
    
    // Map rows to ProxyIP structure
    const data = rows.map(r => this.mapRowToModel(r));

    return { data, total };
  }

  async findById(id: number): Promise<ProxyIP | null> {
    const row = await this.db.prepare("SELECT * FROM proxies WHERE id = ? LIMIT 1").bind(id).first<ProxyRow>();
    if (!row) return null;
    return this.mapRowToModel(row);
  }

  async create(p: Omit<ProxyIP, "id" | "created_at" | "updated_at">): Promise<ProxyIP> {
    const insert = this.db.prepare(`
      INSERT INTO proxies (
        proxy, port, proxyip, ip, latency, asn, as_organization, 
        colo, country, city, region, postal_code, latitude, longitude, is_active
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?
      ) RETURNING id
    `);

    const result = await insert.bind(
      p.proxy,
      p.port,
      p.proxyip ? 1 : 0,
      p.ip,
      p.latency,
      p.asn,
      p.as_organization,
      p.colo,
      p.country,
      p.city,
      p.region,
      p.postal_code,
      p.latitude,
      p.longitude,
      p.is_active ? 1 : 0
    ).first<IdRow>();

    if (!result) throw new Error("Failed to create proxy");
    const created = await this.findById(result.id);
    if (!created) throw new Error("Failed to find created proxy");
    return created;
  }

  async update(id: number, p: Partial<ProxyIP>): Promise<ProxyIP> {
    const fields: string[] = [];
    const params: (string | number | null)[] = [];

    const updatableFields: (keyof ProxyIP)[] = [
      "proxy", "port", "proxyip", "ip", "latency", "asn", "as_organization",
      "colo", "country", "city", "region", "postal_code", "latitude", "longitude", "is_active"
    ];

    for (const key of updatableFields) {
      if (p[key] !== undefined) {
        let value: string | number | null = null;
        if (key === "proxyip") {
          value = p.proxyip ? 1 : 0;
        } else if (key === "is_active") {
          value = p.is_active ? 1 : 0;
        } else if (key === "asn") {
          value = p.asn !== undefined && p.asn !== null ? Number(p.asn) : null;
        } else if (key === "latency") {
          value = p.latency !== undefined ? Number(p.latency) : 0;
        } else {
          const val = p[key];
          value = val !== undefined ? (val as string | null) : null;
        }

        const columnName = key === "as_organization" ? "as_organization" : (key === "postal_code" ? "postal_code" : key);
        fields.push(`${columnName} = ?`);
        params.push(value);
      }
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      const sql = `UPDATE proxies SET ${fields.join(", ")} WHERE id = ?`;
      params.push(id);
      await this.db.prepare(sql).bind(...params).run();
    }

    const updated = await this.findById(id);
    if (!updated) throw new Error("Failed to find updated proxy");
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.db.prepare("DELETE FROM proxies WHERE id = ?").bind(id).run();
  }

  async bulkCreate(proxies: Omit<ProxyIP, "id" | "created_at" | "updated_at">[]): Promise<number> {
    const insertProxy = this.db.prepare(`
      INSERT INTO proxies (
        proxy, port, proxyip, ip, latency, asn, as_organization, 
        colo, country, city, region, postal_code, latitude, longitude, is_active
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, ?, ?, 1
      )
    `);

    const statements: D1PreparedStatement[] = [];
    let count = 0;
    for (const p of proxies) {
      statements.push(
        insertProxy.bind(
          p.proxy,
          p.port,
          p.proxyip ? 1 : 0,
          p.ip,
          p.latency || 0,
          p.asn,
          p.as_organization,
          p.colo,
          p.country,
          p.city,
          p.region,
          p.postal_code,
          p.latitude,
          p.longitude
        )
      );
      count++;
    }

    if (statements.length > 0) {
      const CHUNK_SIZE = 100;
      for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
        const chunk = statements.slice(i, i + CHUNK_SIZE);
        await this.db.batch(chunk);
      }
    }

    return count;
  }

  async getPublicList(): Promise<PublicProxyItem[]> {
    const { results } = await this.db.prepare("SELECT * FROM proxies WHERE is_active = 1").all<ProxyRow>();
    const rows = results || [];
    return rows.map((r) => ({
      proxy: r.proxy,
      port: r.port,
      proxyip: r.proxyip === 1,
      ip: r.ip,
      latency: r.latency,
      asn: r.asn,
      asOrganization: r.as_organization,
      colo: r.colo,
      country: r.country,
      city: r.city,
      region: r.region,
      postalCode: r.postal_code,
      latitude: r.latitude,
      longitude: r.longitude,
    }));
  }

  async count(): Promise<number> {
    const result = await this.db.prepare("SELECT COUNT(*) as count FROM proxies").first<CountRow>();
    return result ? result.count : 0;
  }

  private mapRowToModel(r: ProxyRow): ProxyIP {
    return {
      id: r.id,
      proxy: r.proxy,
      port: r.port,
      proxyip: r.proxyip === 1,
      ip: r.ip,
      latency: r.latency,
      asn: r.asn,
      as_organization: r.as_organization,
      colo: r.colo,
      country: r.country,
      city: r.city,
      region: r.region,
      postal_code: r.postal_code,
      latitude: r.latitude,
      longitude: r.longitude,
      is_active: r.is_active === 1,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  async findAllActive(): Promise<ProxyIP[]> {
    const { results } = await this.db.prepare("SELECT * FROM proxies WHERE is_active = 1").all<ProxyRow>();
    const rows = results || [];
    return rows.map(r => this.mapRowToModel(r));
  }

  async bulkDelete(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;
    const statements: D1PreparedStatement[] = [];
    for (const id of ids) {
      statements.push(this.db.prepare("DELETE FROM proxies WHERE id = ?").bind(id));
    }
    const CHUNK_SIZE = 100;
    for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
      const chunk = statements.slice(i, i + CHUNK_SIZE);
      await this.db.batch(chunk);
    }
    return ids.length;
  }
}
