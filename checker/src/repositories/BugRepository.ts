import { Database } from "bun:sqlite";
import { Bug } from "../models/Bug";
import { BugRow } from "../entities/BugEntity";
import { CountRow, IdRow } from "../entities/CommonEntity";
import { IBugRepository } from "./interfaces";

export class BugRepository implements IBugRepository {
  constructor(private db: Database) {}

  findAll(): Bug[] {
    const rows = this.db.query("SELECT * FROM bugs ORDER BY id DESC").all() as BugRow[];
    return rows.map((r) => ({
      id: r.id,
      hostname: r.hostname,
      is_active: r.is_active === 1,
      created_at: r.created_at,
    }));
  }

  findByHostname(hostname: string): Bug | null {
    const row = this.db.query("SELECT * FROM bugs WHERE hostname = ? LIMIT 1").get(hostname) as BugRow | null;
    if (!row) return null;
    return {
      id: row.id,
      hostname: row.hostname,
      is_active: row.is_active === 1,
      created_at: row.created_at,
    };
  }

  create(hostname: string): Bug {
    const result = this.db.prepare("INSERT INTO bugs (hostname, is_active) VALUES (?, 1) RETURNING id").get(hostname) as IdRow;
    const row = this.db.query("SELECT * FROM bugs WHERE id = ?").get(result.id) as BugRow;
    return {
      id: row.id,
      hostname: row.hostname,
      is_active: row.is_active === 1,
      created_at: row.created_at,
    };
  }

  delete(id: number): void {
    this.db.query("DELETE FROM bugs WHERE id = ?").run(id);
  }

  bulkCreate(bugs: string[]): number {
    const insertBug = this.db.prepare("INSERT OR IGNORE INTO bugs (hostname, is_active) VALUES (?, 1)");
    let count = 0;
    const transaction = this.db.transaction((list: string[]) => {
      for (const b of list) {
        const clean = b.trim().toLowerCase();
        if (clean) {
          insertBug.run(clean);
          count++;
        }
      }
    });
    transaction(bugs);
    return count;
  }

  getPublicList(): string[] {
    const rows = this.db.query("SELECT hostname FROM bugs WHERE is_active = 1").all() as { hostname: string }[];
    return rows.map((r) => r.hostname);
  }

  count(): number {
    const result = this.db.query("SELECT COUNT(*) as count FROM bugs").get() as CountRow;
    return result.count;
  }
}
