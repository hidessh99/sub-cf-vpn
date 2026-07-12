import { Database } from "bun:sqlite";
import { Domain } from "../models/Domain";
import { DomainRow, CountRow, IdRow } from "../types/db";
import { IDomainRepository } from "./interfaces";

export class DomainRepository implements IDomainRepository {
  constructor(private db: Database) {}

  findAll(): Domain[] {
    const rows = this.db.query("SELECT * FROM domains ORDER BY id DESC").all() as DomainRow[];
    return rows.map((r) => ({
      id: r.id,
      domain: r.domain,
      is_active: r.is_active === 1,
      created_at: r.created_at,
    }));
  }

  findByDomain(domain: string): Domain | null {
    const row = this.db.query("SELECT * FROM domains WHERE domain = ? LIMIT 1").get(domain) as DomainRow | null;
    if (!row) return null;
    return {
      id: row.id,
      domain: row.domain,
      is_active: row.is_active === 1,
      created_at: row.created_at,
    };
  }

  create(domain: string): Domain {
    const result = this.db.prepare("INSERT INTO domains (domain, is_active) VALUES (?, 1) RETURNING id").get(domain) as IdRow;
    const row = this.db.query("SELECT * FROM domains WHERE id = ?").get(result.id) as DomainRow;
    return {
      id: row.id,
      domain: row.domain,
      is_active: row.is_active === 1,
      created_at: row.created_at,
    };
  }

  delete(id: number): void {
    this.db.query("DELETE FROM domains WHERE id = ?").run(id);
  }

  bulkCreate(domains: string[]): number {
    const insertDomain = this.db.prepare("INSERT OR IGNORE INTO domains (domain, is_active) VALUES (?, 1)");
    let count = 0;
    const transaction = this.db.transaction((list: string[]) => {
      for (const d of list) {
        const clean = d.trim().toLowerCase();
        if (clean) {
          const result = insertDomain.run(clean) as { changes: number };
          count += result.changes;
        }
      }
    });
    transaction(domains);
    return count;
  }

  getPublicList(): string[] {
    const rows = this.db.query("SELECT domain FROM domains WHERE is_active = 1").all() as { domain: string }[];
    return rows.map((r) => r.domain);
  }

  count(): number {
    const result = this.db.query("SELECT COUNT(*) as count FROM domains").get() as CountRow;
    return result.count;
  }
}
