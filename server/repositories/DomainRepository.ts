import { Domain } from "../models/Domain";
import { DomainRow } from "../entities/DomainEntity";
import { CountRow, IdRow } from "../entities/CommonEntity";
import { IDomainRepository } from "./interfaces";

export class DomainRepository implements IDomainRepository {
  constructor(private db: D1Database) {}

  async findAll(): Promise<Domain[]> {
    const { results } = await this.db.prepare("SELECT * FROM domains ORDER BY id DESC").all<DomainRow>();
    const rows = results || [];
    return rows.map((r) => ({
      id: r.id,
      domain: r.domain,
      is_active: r.is_active === 1,
      created_at: r.created_at,
    }));
  }

  async findByDomain(domain: string): Promise<Domain | null> {
    const row = await this.db.prepare("SELECT * FROM domains WHERE domain = ? LIMIT 1").bind(domain).first<DomainRow>();
    if (!row) return null;
    return {
      id: row.id,
      domain: row.domain,
      is_active: row.is_active === 1,
      created_at: row.created_at,
    };
  }

  async create(domain: string): Promise<Domain> {
    const result = await this.db.prepare("INSERT INTO domains (domain, is_active) VALUES (?, 1) RETURNING id").bind(domain).first<IdRow>();
    if (!result) throw new Error("Failed to insert domain");
    const row = await this.db.prepare("SELECT * FROM domains WHERE id = ?").bind(result.id).first<DomainRow>();
    if (!row) throw new Error("Failed to find created domain");
    return {
      id: row.id,
      domain: row.domain,
      is_active: row.is_active === 1,
      created_at: row.created_at,
    };
  }

  async delete(id: number): Promise<void> {
    await this.db.prepare("DELETE FROM domains WHERE id = ?").bind(id).run();
  }

  async bulkCreate(domains: string[]): Promise<number> {
    const statements: D1PreparedStatement[] = [];
    let count = 0;
    for (const d of domains) {
      const clean = d.trim().toLowerCase();
      if (clean) {
        statements.push(
          this.db.prepare("INSERT OR IGNORE INTO domains (domain, is_active) VALUES (?, 1)").bind(clean)
        );
        count++;
      }
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

  async getPublicList(): Promise<string[]> {
    const { results } = await this.db.prepare("SELECT domain FROM domains WHERE is_active = 1").all<{ domain: string }>();
    const rows = results || [];
    return rows.map((r) => r.domain);
  }

  async count(): Promise<number> {
    const result = await this.db.prepare("SELECT COUNT(*) as count FROM domains").first<CountRow>();
    return result ? result.count : 0;
  }
}
