import { Bug } from "../models/Bug";
import { BugRow } from "../entities/BugEntity";
import { CountRow, IdRow } from "../entities/CommonEntity";
import { IBugRepository } from "./interfaces";

export class BugRepository implements IBugRepository {
  constructor(private db: D1Database) {}

  async findAll(): Promise<Bug[]> {
    const { results } = await this.db.prepare("SELECT * FROM bugs ORDER BY id DESC").all<BugRow>();
    const rows = results || [];
    return rows.map((r) => ({
      id: r.id,
      hostname: r.hostname,
      is_active: r.is_active === 1,
      created_at: r.created_at,
    }));
  }

  async findByHostname(hostname: string): Promise<Bug | null> {
    const row = await this.db.prepare("SELECT * FROM bugs WHERE hostname = ? LIMIT 1").bind(hostname).first<BugRow>();
    if (!row) return null;
    return {
      id: row.id,
      hostname: row.hostname,
      is_active: row.is_active === 1,
      created_at: row.created_at,
    };
  }

  async create(hostname: string): Promise<Bug> {
    const result = await this.db.prepare("INSERT INTO bugs (hostname, is_active) VALUES (?, 1) RETURNING id").bind(hostname).first<IdRow>();
    if (!result) throw new Error("Failed to insert bug");
    const row = await this.db.prepare("SELECT * FROM bugs WHERE id = ?").bind(result.id).first<BugRow>();
    if (!row) throw new Error("Failed to find created bug");
    return {
      id: row.id,
      hostname: row.hostname,
      is_active: row.is_active === 1,
      created_at: row.created_at,
    };
  }

  async delete(id: number): Promise<void> {
    await this.db.prepare("DELETE FROM bugs WHERE id = ?").bind(id).run();
  }

  async bulkCreate(bugs: string[]): Promise<number> {
    const statements: D1PreparedStatement[] = [];
    let count = 0;
    for (const b of bugs) {
      const clean = b.trim().toLowerCase();
      if (clean) {
        statements.push(
          this.db.prepare("INSERT OR IGNORE INTO bugs (hostname, is_active) VALUES (?, 1)").bind(clean)
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
    const { results } = await this.db.prepare("SELECT hostname FROM bugs WHERE is_active = 1").all<{ hostname: string }>();
    const rows = results || [];
    return rows.map((r) => r.hostname);
  }

  async count(): Promise<number> {
    const result = await this.db.prepare("SELECT COUNT(*) as count FROM bugs").first<CountRow>();
    return result ? result.count : 0;
  }
}
