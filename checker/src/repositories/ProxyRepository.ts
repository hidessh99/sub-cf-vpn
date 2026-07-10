import { db } from "../../database/database";
import { ProxyIP } from "../models/ProxyIP";
import { ProxyRow } from "../entities/ProxyEntity";
import { CountRow, IdRow } from "../entities/CommonEntity";
import { PublicProxyItem } from "../dto/response.dto";

export class ProxyRepository {
  findAll(
    page: number,
    limit: number,
    filters: { country?: string; is_active?: boolean; search?: string } = {}
  ): { data: ProxyIP[]; total: number } {
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
    const countResult = db.query(countSql).get(...params) as CountRow;
    const total = countResult.count;

    // Get paginated data
    const dataSql = `SELECT * ${baseQuery} ORDER BY id DESC LIMIT ? OFFSET ?`;
    const offset = (page - 1) * limit;
    const selectParams = [...params, limit, offset];
    
    const rows = db.query(dataSql).all(...selectParams) as ProxyRow[];
    
    // Map rows to ProxyIP structure
    const data = rows.map(r => this.mapRowToModel(r));

    return { data, total };
  }

  findById(id: number): ProxyIP | null {
    const row = db.query("SELECT * FROM proxies WHERE id = ? LIMIT 1").get(id) as ProxyRow | null;
    if (!row) return null;
    return this.mapRowToModel(row);
  }

  create(p: Omit<ProxyIP, "id" | "created_at" | "updated_at">): ProxyIP {
    const insert = db.prepare(`
      INSERT INTO proxies (
        proxy, port, proxyip, ip, latency, asn, as_organization, 
        colo, country, city, region, postal_code, latitude, longitude, is_active
      ) VALUES (
        $proxy, $port, $proxyip, $ip, $latency, $asn, $as_organization,
        $colo, $country, $city, $region, $postal_code, $latitude, $longitude, $is_active
      ) RETURNING id
    `);

    const result = insert.get({
      $proxy: p.proxy,
      $port: p.port,
      $proxyip: p.proxyip ? 1 : 0,
      $ip: p.ip,
      $latency: p.latency,
      $asn: p.asn,
      $as_organization: p.as_organization,
      $colo: p.colo,
      $country: p.country,
      $city: p.city,
      $region: p.region,
      $postal_code: p.postal_code,
      $latitude: p.latitude,
      $longitude: p.longitude,
      $is_active: p.is_active ? 1 : 0
    }) as IdRow;

    return this.findById(result.id)!;
  }

  update(id: number, p: Partial<ProxyIP>): ProxyIP {
    const fields: string[] = [];
    const values: Record<string, string | number | null> = {};

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
          value = p.asn;
        } else if (key === "latency") {
          value = p.latency !== undefined ? Number(p.latency) : 0;
        } else {
          value = p[key] as string | null;
        }

        fields.push(`${key} = $${key}`);
        values[`$${key}`] = value;
      }
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      const sql = `UPDATE proxies SET ${fields.join(", ")} WHERE id = $id`;
      db.prepare(sql).run({ ...values, $id: id });
    }

    return this.findById(id)!;
  }

  delete(id: number): void {
    db.query("DELETE FROM proxies WHERE id = ?").run(id);
  }

  bulkCreate(proxies: Omit<ProxyIP, "id" | "created_at" | "updated_at">[]): number {
    const insertProxy = db.prepare(`
      INSERT INTO proxies (
        proxy, port, proxyip, ip, latency, asn, as_organization, 
        colo, country, city, region, postal_code, latitude, longitude, is_active
      ) VALUES (
        $proxy, $port, $proxyip, $ip, $latency, $asn, $as_organization,
        $colo, $country, $city, $region, $postal_code, $latitude, $longitude, 1
      )
    `);

    let count = 0;
    const transaction = db.transaction((list: Omit<ProxyIP, "id" | "created_at" | "updated_at">[]) => {
      for (const p of list) {
        insertProxy.run({
          $proxy: p.proxy,
          $port: p.port,
          $proxyip: p.proxyip ? 1 : 0,
          $ip: p.ip,
          $latency: p.latency || 0,
          $asn: p.asn,
          $as_organization: p.as_organization,
          $colo: p.colo,
          $country: p.country,
          $city: p.city,
          $region: p.region,
          $postal_code: p.postal_code,
          $latitude: p.latitude,
          $longitude: p.longitude
        });
        count++;
      }
    });

    transaction(proxies);
    return count;
  }

  getPublicList(): PublicProxyItem[] {
    const rows = db.query("SELECT * FROM proxies WHERE is_active = 1").all() as ProxyRow[];
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

  count(): number {
    const result = db.query("SELECT COUNT(*) as count FROM proxies").get() as CountRow;
    return result.count;
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
}
